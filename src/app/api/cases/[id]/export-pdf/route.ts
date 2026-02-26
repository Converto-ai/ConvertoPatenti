import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth/config";
import { db, pratiche } from "@/src/lib/db";
import { eq, and } from "drizzle-orm";
import { generatePraticaPDF } from "@/src/lib/pdf/generator";
import countriesData from "@/data/countries.json";

const COUNTRY_MAP = Object.fromEntries(
  (countriesData.countries as { iso: string; name_it: string }[]).map((c) => [
    c.iso,
    c.name_it,
  ])
);

export async function GET(
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
    with: {
      autoscuola: { columns: { nome: true } },
    },
  });

  if (!pratica) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfData = {
    id: pratica.id,
    autoscuolaNome: pratica.autoscuola?.nome ?? "Autoscuola",
    stato: pratica.stato,
    classificazione: pratica.classificazione,
    classificazioneReasons: (pratica.classificazioneReasons as string[]) ?? [],
    documentiRichiesti:
      (pratica.documentiRichiestiOutput as {
        doc_id: string;
        nome: string;
        obbligatorio: boolean;
        note?: string;
      }[]) ?? [],
    infoMancanti: (pratica.infoMancanti as string[]) ?? [],
    candidato: {
      nome: pratica.candidatoNome,
      cognome: pratica.candidatoCognome,
      nascita: pratica.candidatoNascita,
    },
    patente: {
      paeseRilascio: pratica.paeseRilascio,
      paeseNome: pratica.paeseRilascio
        ? (COUNTRY_MAP[pratica.paeseRilascio] ?? pratica.paeseRilascio)
        : null,
      categoria: pratica.categoriaPatente,
      dataRilascio: pratica.dataRilascioPatente,
      dataScadenza: pratica.dataScadenzaPatente,
      valida: pratica.patenteValida,
    },
    residenza: {
      dataPrimaResidenza: pratica.dataPrimaResidenza,
      tipoSoggiorno: pratica.tipoSoggiorno,
      scadenzaPermesso: pratica.scadenzaPermesso,
    },
    classificazioneVersione: pratica.classificazioneVersione,
    classificazioneAt: pratica.classificazioneAt,
    generatAt: new Date(),
  };

  const pdfBuffer = await generatePraticaPDF(pdfData);

  const cognome = pratica.candidatoCognome ?? "candidato";
  const filename = `pratica-${cognome.toLowerCase()}-${id.slice(0, 8)}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
