import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth/config";
import { db, pratiche } from "@/src/lib/db";
import { eq, and } from "drizzle-orm";
import { evaluateWithDataset } from "@/src/lib/rules-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.autoscuolaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const pratica = await db.query.pratiche.findFirst({
    where: and(
      eq(pratiche.id, id),
      eq(pratiche.autoscuolaId, session.user.autoscuolaId)
    ),
  });

  if (!pratica) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = evaluateWithDataset({
    country_of_issue: pratica.paeseRilascio,
    license_category: pratica.categoriaPatente,
    license_issue_date: pratica.dataRilascioPatente
      ? new Date(pratica.dataRilascioPatente)
      : null,
    license_expiry_date: pratica.dataScadenzaPatente
      ? new Date(pratica.dataScadenzaPatente)
      : null,
    license_valid: pratica.patenteValida,
    italy_residency_date: pratica.dataPrimaResidenza
      ? new Date(pratica.dataPrimaResidenza)
      : null,
    permit_type: pratica.tipoSoggiorno as
      | "permesso_soggiorno"
      | "carta_soggiorno"
      | "cittadino_eu"
      | null,
    permit_expiry_date: pratica.scadenzaPermesso
      ? new Date(pratica.scadenzaPermesso)
      : null,
  });

  // Save to DB
  await db
    .update(pratiche)
    .set({
      classificazione: result.classification,
      classificazioneReasons: result.reasons,
      documentiRichiestiOutput: result.required_documents,
      infoMancanti: result.missing_information,
      classificazioneAt: result.evaluated_at,
      classificazioneVersione: result.dataset_version,
      updatedAt: new Date(),
    })
    .where(eq(pratiche.id, id));

  return NextResponse.json(result);
}
