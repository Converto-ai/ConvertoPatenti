import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth/config";
import { db, pratiche } from "@/src/lib/db";
import { eq, and, desc, like, SQL } from "drizzle-orm";
import { createTelegramToken } from "@/src/lib/telegram/token";
import { z } from "zod";

const createSchema = z.object({
  note_iniziali: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.autoscuolaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const stato = searchParams.get("stato");
  const classificazione = searchParams.get("classificazione");
  const paese = searchParams.get("paese");
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [
    eq(pratiche.autoscuolaId, session.user.autoscuolaId),
  ];

  if (stato) conditions.push(eq(pratiche.stato, stato));
  if (classificazione) conditions.push(eq(pratiche.classificazione, classificazione));
  if (paese) conditions.push(eq(pratiche.paeseRilascio, paese));
  if (q) {
    conditions.push(
      like(pratiche.candidatoCognome, `%${q}%`)
    );
  }

  const where = and(...conditions);

  const [results, countResult] = await Promise.all([
    db.query.pratiche.findMany({
      where,
      orderBy: [desc(pratiche.createdAt)],
      limit,
      offset,
      columns: {
        id: true,
        stato: true,
        classificazione: true,
        candidatoNome: true,
        candidatoCognome: true,
        paeseRilascio: true,
        categoriaPatente: true,
        telegramToken: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db
      .$count(pratiche, where),
  ]);

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "ConvertoPatentiBot";

  const data = results.map((p) => ({
    ...p,
    telegram_link: `https://t.me/${botUsername}?start=${p.telegramToken}`,
  }));

  return NextResponse.json({
    data,
    total: countResult,
    page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.autoscuolaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 422 });
  }

  // Create pratica + generate Telegram token (32-char hex, safe for t.me?start=)
  const praticaId = crypto.randomUUID();
  const token = createTelegramToken();

  const [pratica] = await db
    .insert(pratiche)
    .values({
      id: praticaId,
      autoscuolaId: session.user.autoscuolaId,
      operatoreId: session.user.id,
      telegramToken: token,
      stato: "attesa_candidato",
      noteOperatore: parsed.data.note_iniziali ?? null,
    })
    .returning();

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "ConvertoPatentiBot";

  return NextResponse.json(
    {
      id: pratica.id,
      telegram_token: token,
      telegram_link: `https://t.me/${botUsername}?start=${token}`,
      stato: pratica.stato,
      created_at: pratica.createdAt,
    },
    { status: 201 }
  );
}
