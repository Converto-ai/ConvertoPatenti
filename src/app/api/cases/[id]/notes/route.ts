import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth/config";
import { db, pratiche, notePratica } from "@/src/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const noteSchema = z.object({
  testo: z.string().min(1).max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.autoscuolaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = noteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error" }, { status: 422 });
  }

  // Verify ownership
  const pratica = await db.query.pratiche.findFirst({
    where: and(
      eq(pratiche.id, id),
      eq(pratiche.autoscuolaId, session.user.autoscuolaId)
    ),
    columns: { id: true },
  });

  if (!pratica) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [nota] = await db
    .insert(notePratica)
    .values({
      praticaId: id,
      operatoreId: session.user.id,
      testo: parsed.data.testo,
    })
    .returning();

  return NextResponse.json(nota, { status: 201 });
}
