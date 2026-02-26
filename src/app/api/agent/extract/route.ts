import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth/config";
import { db, fontiNormative } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import { extractTextFromFile, runExtractionAgent } from "@/src/lib/agent";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.autoscuolaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin operators can run agent extractions
  if (session.user.ruolo !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY not configured. See docs/API_KEYS_NEEDED.md for setup instructions.",
      },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const sourceType = formData.get("source_type") as string ?? "altro";
  const sourceUrl = formData.get("source_url") as string ?? null;

  if (!file) {
    return NextResponse.json({ error: "File required" }, { status: 422 });
  }

  // Validate file size (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 422 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hashContenuto = crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");

  // Extract text
  let text: string;
  try {
    text = await extractTextFromFile(buffer, file.type, file.name);
  } catch (err) {
    return NextResponse.json(
      { error: `Cannot extract text: ${(err as Error).message}` },
      { status: 422 }
    );
  }

  if (!text || text.trim().length < 100) {
    return NextResponse.json(
      { error: "Extracted text too short — file may be empty or encrypted" },
      { status: 422 }
    );
  }

  // Create fonte record
  const versione = new Date().toISOString().split("T")[0];
  const [fonte] = await db
    .insert(fontiNormative)
    .values({
      nome: file.name,
      tipo: file.type.includes("pdf")
        ? "pdf"
        : file.type.includes("word")
        ? "docx"
        : "html",
      urlOriginale: sourceUrl,
      hashContenuto,
      versione,
      statoReview: "pending",
    })
    .returning();

  // Run agent (async — respond immediately with extraction_id)
  // In production: use a job queue (Inngest/BullMQ) for long-running tasks
  // For MVP: run synchronously (may take 30-60 seconds)
  try {
    const result = await runExtractionAgent(text, sourceType);

    // Save result to fonte record
    await db
      .update(fontiNormative)
      .set({
        estrattoJson: result,
        statoReview: result.review_required ? "pending" : "reviewed",
      })
      .where(eq(fontiNormative.id, fonte.id));

    return NextResponse.json({
      extraction_id: fonte.id,
      status: "completed",
      result,
    });
  } catch (err) {
    console.error("[Agent] Extraction error:", err);
    return NextResponse.json(
      {
        error: "Extraction failed",
        details: (err as Error).message,
        extraction_id: fonte.id,
      },
      { status: 500 }
    );
  }
}
