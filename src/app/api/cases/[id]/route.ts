import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth/config";
import { db, pratiche, documentiPratica, notePratica } from "@/src/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  stato: z.enum(["attesa_candidato", "intake_in_corso", "valutazione", "completata", "archiviata"]).optional(),
  note_operatore: z.string().max(2000).optional(),
});

async function getPraticaOrFail(
  id: string,
  autoscuolaId: string
) {
  const pratica = await db.query.pratiche.findFirst({
    where: and(eq(pratiche.id, id), eq(pratiche.autoscuolaId, autoscuolaId)),
    with: {
      autoscuola: { columns: { nome: true } },
      operatore: { columns: { nome: true, cognome: true } },
      documenti: true,
      note: {
        with: { operatore: { columns: { nome: true, cognome: true } } },
        orderBy: (n, { desc }) => [desc(n.createdAt)],
      },
    },
  });
  return pratica;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.autoscuolaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pratica = await getPraticaOrFail(id, session.user.autoscuolaId);

  if (!pratica) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "ConvertoPatentiBot";

  return NextResponse.json({
    ...pratica,
    telegram_link: `https://t.me/${botUsername}?start=${pratica.telegramToken}`,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.autoscuolaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error" }, { status: 422 });
  }

  // Verify ownership
  const existing = await db.query.pratiche.findFirst({
    where: and(eq(pratiche.id, id), eq(pratiche.autoscuolaId, session.user.autoscuolaId)),
    columns: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.stato !== undefined) updates.stato = parsed.data.stato;
  if (parsed.data.note_operatore !== undefined) updates.noteOperatore = parsed.data.note_operatore;

  await db.update(pratiche).set(updates).where(eq(pratiche.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.autoscuolaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const result = await db
    .delete(pratiche)
    .where(
      and(
        eq(pratiche.id, id),
        eq(pratiche.autoscuolaId, session.user.autoscuolaId)
      )
    )
    .returning({ id: pratiche.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
