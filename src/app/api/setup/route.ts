import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { autoscuole, operatori } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Find autoscuola by email
  const [autoscuola] = await db
    .select()
    .from(autoscuole)
    .where(eq(autoscuole.email, email))
    .limit(1);

  if (!autoscuola) {
    return NextResponse.json({ error: "Autoscuola non trovata." }, { status: 404 });
  }

  // Check no operator exists yet
  const [existing] = await db
    .select({ id: operatori.id })
    .from(operatori)
    .where(eq(operatori.autoscuolaId, autoscuola.id))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Account già configurato. Vai al login." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Extract nome/cognome from autoscuola name (e.g. "Autoscuola Roma" → nome="Autoscuola", cognome="Roma")
  const parts = autoscuola.nome.trim().split(/\s+/);
  const nome = parts[0] ?? autoscuola.nome;
  const cognome = parts.slice(1).join(" ") || "-";

  await db.insert(operatori).values({
    autoscuolaId: autoscuola.id,
    nome,
    cognome,
    email,
    passwordHash,
    ruolo: "admin",
    attivo: true,
  });

  return NextResponse.json({ ok: true });
}
