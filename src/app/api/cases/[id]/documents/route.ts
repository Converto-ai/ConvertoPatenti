import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth/config";
import { db, documentiGenerati, pratiche } from "@/src/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { generateDocumentsForPratica } from "@/src/lib/pdf/documents-generator";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/cases/[id]/documents — lista documenti generati
export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verifica ownership pratica
  const pratica = await db.query.pratiche.findFirst({
    where: and(eq(pratiche.id, id), eq(pratiche.autoscuolaId, session.user.autoscuolaId)),
    columns: { id: true },
  });
  if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const docs = await db
    .select()
    .from(documentiGenerati)
    .where(eq(documentiGenerati.praticaId, id))
    .orderBy(desc(documentiGenerati.createdAt));

  return NextResponse.json({ documents: docs });
}

// POST /api/cases/[id]/documents — genera/rigenera documenti
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verifica ownership e stato pratica
  const pratica = await db.query.pratiche.findFirst({
    where: and(eq(pratiche.id, id), eq(pratiche.autoscuolaId, session.user.autoscuolaId)),
    columns: { id: true, classificazione: true },
  });
  if (!pratica) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const result = await generateDocumentsForPratica(id, session.user.autoscuolaId);

    if (result.errors.length > 0 && result.generated.length === 0) {
      return NextResponse.json({ error: "Generazione fallita", details: result.errors }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
