import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { autoscuole, operatori } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email mancante." }, { status: 400 });
  }

  const [autoscuola] = await db
    .select({ id: autoscuole.id, nome: autoscuole.nome })
    .from(autoscuole)
    .where(eq(autoscuole.email, email))
    .limit(1);

  if (!autoscuola) {
    return NextResponse.json(
      { error: "Nessun account trovato per questa email." },
      { status: 404 }
    );
  }

  // Check if already set up
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

  return NextResponse.json({ nome: autoscuola.nome });
}
