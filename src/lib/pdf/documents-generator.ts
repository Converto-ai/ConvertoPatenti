/**
 * Orchestrator: genera i documenti per una pratica completata
 * e li salva su Vercel Blob.
 *
 * Logica:
 * - LIKELY_CONVERTIBLE     → Scheda Pratica + TT2112
 * - NOT_CONVERTIBLE_EXAMS  → Scheda Pratica + Scheda Avvio Esami
 * - NEEDS_REVIEW           → Scheda Pratica (solo)
 */
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { put } from "@vercel/blob";
import { db, documentiGenerati, pratiche } from "@/src/lib/db";
import { eq, and } from "drizzle-orm";
import { SchedaPraticaDocument } from "./scheda-pratica";
import { SchedaEsamiDocument } from "./scheda-esami";
import { fillTT2112 } from "./tt2112-filler";
import { mapPraticaToTT2112 } from "./tt2112-mapping";
import type { SchedaPraticaData } from "./scheda-pratica";
import type { SchedaEsamiData } from "./scheda-esami";
import countriesData from "@/data/countries.json";

const COUNTRY_MAP = Object.fromEntries(
  (countriesData.countries as { iso: string; name_it: string }[]).map((c) => [
    c.iso,
    c.name_it,
  ])
);

const BOTUSERNAME = process.env.TELEGRAM_BOT_USERNAME ?? "ConvertoPatentiBot";

export interface GenerateResult {
  generated: { tipoDocumento: string; nomeFile: string; url: string }[];
  errors: string[];
}

export async function generateDocumentsForPratica(
  praticaId: string,
  autoscuolaId: string
): Promise<GenerateResult> {
  const result: GenerateResult = { generated: [], errors: [] };
  const now = new Date();

  // Carica pratica
  const pratica = await db.query.pratiche.findFirst({
    where: and(
      eq(pratiche.id, praticaId),
      eq(pratiche.autoscuolaId, autoscuolaId)
    ),
    with: { autoscuola: { columns: { nome: true } } },
  });

  if (!pratica) throw new Error("Pratica non trovata");

  const autoscuolaNome = (pratica.autoscuola as { nome: string } | null)?.nome ?? "Autoscuola";
  const paeseNome = pratica.paeseRilascio ? COUNTRY_MAP[pratica.paeseRilascio] ?? pratica.paeseRilascio : null;
  const telegramLink = `https://t.me/${BOTUSERNAME}?start=${pratica.telegramToken}`;

  const classificazione = pratica.classificazione;
  const reasons = (pratica.classificazioneReasons as string[]) ?? [];
  const docsRequired = (pratica.documentiRichiestiOutput as { doc_id: string; nome: string; obbligatorio: boolean }[]) ?? [];
  const infoMancanti = (pratica.infoMancanti as string[]) ?? [];

  // ─── Helper: salva un buffer su Blob e registra in DB ─────────────────────
  const saveDoc = async (
    tipo: string,
    nomeFile: string,
    buffer: Buffer,
    contentType: string
  ) => {
    const storageKey = `pratiche/${praticaId}/${tipo}/${Date.now()}-${nomeFile}`;
    const blob = await put(storageKey, buffer, {
      access: "public",
      contentType,
    });

    // Cancella vecchie versioni (stesso tipo)
    await db.delete(documentiGenerati).where(
      and(
        eq(documentiGenerati.praticaId, praticaId),
        eq(documentiGenerati.tipoDocumento, tipo)
      )
    );

    await db.insert(documentiGenerati).values({
      praticaId,
      autoscuolaId,
      tipoDocumento: tipo,
      storageKey: blob.url,
      nomeFile,
      versione: 1,
    });

    result.generated.push({ tipoDocumento: tipo, nomeFile, url: blob.url });
  };

  // ─── 1. SCHEDA PRATICA (sempre) ───────────────────────────────────────────
  try {
    const schedaData: SchedaPraticaData = {
      id: pratica.id,
      autoscuolaNome,
      classificazione,
      classificazioneReasons: reasons,
      classificazioneVersione: pratica.classificazioneVersione,
      classificazioneAt: pratica.classificazioneAt,
      documentiRichiesti: docsRequired,
      infoMancanti,
      candidato: {
        nome: pratica.candidatoNome,
        cognome: pratica.candidatoCognome,
        nascita: pratica.candidatoNascita,
      },
      patente: {
        paeseNome,
        categoria: pratica.categoriaPatente,
        dataRilascio: pratica.dataRilascioPatente,
        dataScadenza: pratica.dataScadenzaPatente,
      },
      telegramLink,
      generataAt: now,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = React.createElement(SchedaPraticaDocument, { data: schedaData }) as any;
    const buf = Buffer.from(await renderToBuffer(el));
    const nome = `scheda-pratica-${pratica.id.slice(0, 8)}.pdf`;
    await saveDoc("scheda_pratica", nome, buf, "application/pdf");
  } catch (e) {
    result.errors.push(`scheda_pratica: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ─── 2. TT2112 (solo LIKELY_CONVERTIBLE) ─────────────────────────────────
  if (classificazione === "LIKELY_CONVERTIBLE") {
    try {
      const tt2112Data = mapPraticaToTT2112(
        {
          candidatoNome: pratica.candidatoNome,
          candidatoCognome: pratica.candidatoCognome,
          candidatoSesso: pratica.candidatoSesso,
          candidatoNascita: pratica.candidatoNascita,
          candidatoLuogoNascita: pratica.candidatoLuogoNascita,
          candidatoStatoNascita: pratica.candidatoStatoNascita,
          candidatoCodiceFiscale: pratica.candidatoCodiceFiscale,
          candidatoNazionalita: pratica.candidatoNazionalita,
          paeseRilascio: pratica.paeseRilascio,
          paeseNome,
          tipoIstanza: pratica.tipoIstanza,
          categoriaPatente: pratica.categoriaPatente,
          dataRilascioPatente: pratica.dataRilascioPatente,
          residenzaComune: pratica.residenzaComune,
          residenzaProvincia: pratica.residenzaProvincia,
          residenzaIndirizzo: pratica.residenzaIndirizzo,
          residenzaCivico: pratica.residenzaCivico,
          residenzaCap: pratica.residenzaCap,
        },
        autoscuolaNome
      );
      const buf = await fillTT2112(tt2112Data);
      const nome = `tt2112-${pratica.id.slice(0, 8)}.pdf`;
      await saveDoc("tt2112", nome, buf, "application/pdf");
    } catch (e) {
      result.errors.push(`tt2112: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // ─── 3. SCHEDA AVVIO ESAMI (solo NOT_CONVERTIBLE_EXAMS) ──────────────────
  if (classificazione === "NOT_CONVERTIBLE_EXAMS") {
    try {
      const esamiData: SchedaEsamiData = {
        id: pratica.id,
        autoscuolaNome,
        candidato: {
          nome: pratica.candidatoNome,
          cognome: pratica.candidatoCognome,
          nascita: pratica.candidatoNascita,
        },
        patente: { paeseNome, categoria: pratica.categoriaPatente },
        classificazioneReasons: reasons,
        classificazioneVersione: pratica.classificazioneVersione,
        generataAt: now,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const el = React.createElement(SchedaEsamiDocument, { data: esamiData }) as any;
      const buf = Buffer.from(await renderToBuffer(el));
      const nome = `scheda-esami-${pratica.id.slice(0, 8)}.pdf`;
      await saveDoc("scheda_esami", nome, buf, "application/pdf");
    } catch (e) {
      result.errors.push(`scheda_esami: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}
