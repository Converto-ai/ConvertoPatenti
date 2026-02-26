import type { BotContext } from "../types";
import type { Locale } from "../i18n/strings";
import { t } from "../i18n/strings";
import { db, pratiche } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import { evaluateWithDataset } from "@/src/lib/rules-engine";

export async function handleCallback(ctx: BotContext) {
  const data = ctx.callbackQuery?.data ?? "";
  const s = ctx.session;
  const locale = s.locale ?? "it";

  console.log(`[Bot] callback step=${s.step}, data=${data}`);
  await ctx.answerCallbackQuery();

  // ── SESSO ──
  if (s.step === "sesso") {
    s.candidatoSesso = data === "sesso:M" ? "M" : "F";
    s.step = "nascita";
    await ctx.reply(t(locale, "step_nascita_q"), {
      parse_mode: "Markdown",
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  // ── TIPO ISTANZA ──
  if (s.step === "tipo_istanza") {
    s.tipoIstanza = data.replace("tipo_istanza:", "");
    s.step = "data_rilascio";
    await ctx.reply(
      t(locale, "step_data_rilascio_q") + "\n_" + t(locale, "step_data_rilascio_hint") + "_",
      { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  // ── PAESE CONFIRM ──
  if (s.step === "paese_confirm") {
    if (data === "paese:yes") {
      s.step = "categoria";
      await ctx.reply(t(locale, "step_categoria_q"), {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [
            ["A — Moto", "A1 — Moto piccola", "A2 — Moto media"],
            ["B — Auto", "BE — Auto+rimorchio", "B1 — Quadricicli"],
            ["C — Camion", "C1 — Cam. leggero", "D — Bus"],
          ].map((row) => row.map((t) => ({ text: t }))),
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } else {
      s.step = "paese";
      s.paeseIso = undefined;
      s.paeseNome = undefined;
      await ctx.reply(t(locale, "step_paese_q"), { parse_mode: "Markdown" });
    }
    return;
  }

  // ── SCADENZA ──
  if (s.step === "scadenza") {
    if (data === "valid:yes") {
      s.patenteValida = true;
      s.step = "scadenza_date";
      await ctx.reply(t(locale, "step_scadenza_date_q"), { parse_mode: "Markdown" });
    } else if (data === "valid:no") {
      s.patenteValida = false;
      s.step = "scadenza_date";
      await ctx.reply(t(locale, "step_scadenza_date_q"), { parse_mode: "Markdown" });
    } else {
      // unknown
      s.patenteValida = null;
      s.step = "residenza";
      await ctx.reply(t(locale, "step_residenza_q"), {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [[{ text: t(locale, "step_residenza_no_residence") }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    }
    return;
  }

  // ── SOGGIORNO ──
  if (s.step === "soggiorno") {
    const tipo = data.replace("soggiorno:", "");
    s.tipoSoggiorno = tipo === "none" ? null : tipo;

    if (tipo === "permesso_soggiorno") {
      s.step = "soggiorno_scadenza";
      await ctx.reply(t(locale, "step_soggiorno_scadenza_q"), {
        parse_mode: "Markdown",
      });
    } else {
      s.step = "residenza_comune";
      await ctx.reply(t(locale, "step_residenza_comune_q"), {
        parse_mode: "Markdown",
        reply_markup: { remove_keyboard: true },
      });
    }
    return;
  }

  // ── RIEPILOGO CONFIRM ──
  if (s.step === "riepilogo") {
    if (data === "confirm:modify") {
      // Restart from name
      s.step = "nome";
      await ctx.reply(t(locale, "step_nome_q"), {
        parse_mode: "Markdown",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    // confirm:yes → elaborate
    await ctx.reply(t(locale, "step_elaborazione"), { parse_mode: "Markdown" });

    const praticaId = s.praticaId;
    if (!praticaId) return;

    // Save data to DB
    await db
      .update(pratiche)
      .set({
        candidatoNome: s.candidatoNome,
        candidatoCognome: s.candidatoCognome,
        candidatoSesso: s.candidatoSesso,
        tipoIstanza: s.tipoIstanza,
        candidatoNascita: s.candidatoNascita ? new Date(s.candidatoNascita).toISOString().split("T")[0] : null,
        candidatoLuogoNascita: s.candidatoLuogoNascita,
        candidatoStatoNascita: s.candidatoStatoNascita,
        candidatoCodiceFiscale: s.candidatoCodiceFiscale,
        candidatoLingua: locale,
        paeseRilascio: s.paeseIso,
        categoriaPatente: s.categoriaPatente,
        dataRilascioPatente: s.dataRilascio ? new Date(s.dataRilascio).toISOString().split("T")[0] : null,
        dataScadenzaPatente: s.dataScadenza ? new Date(s.dataScadenza).toISOString().split("T")[0] : null,
        patenteValida: s.patenteValida,
        dataPrimaResidenza: s.dataPrimaResidenza ? new Date(s.dataPrimaResidenza).toISOString().split("T")[0] : null,
        tipoSoggiorno: s.tipoSoggiorno,
        scadenzaPermesso: s.scadenzaPermesso ? new Date(s.scadenzaPermesso).toISOString().split("T")[0] : null,
        residenzaComune: s.residenzaComune,
        residenzaProvincia: s.residenzaProvincia,
        residenzaIndirizzo: s.residenzaIndirizzo,
        residenzaCivico: s.residenzaCivico,
        residenzaCap: s.residenzaCap,
        updatedAt: new Date(),
      })
      .where(eq(pratiche.id, praticaId));

    // Run rules engine
    const engineResult = evaluateWithDataset({
      country_of_issue: s.paeseIso ?? null,
      license_category: s.categoriaPatente ?? null,
      license_issue_date: s.dataRilascio ? new Date(s.dataRilascio) : null,
      license_expiry_date: s.dataScadenza ? new Date(s.dataScadenza) : null,
      license_valid: s.patenteValida ?? null,
      italy_residency_date: s.dataPrimaResidenza ? new Date(s.dataPrimaResidenza) : null,
      permit_type: s.tipoSoggiorno as "permesso_soggiorno" | "carta_soggiorno" | "cittadino_eu" | null,
      permit_expiry_date: s.scadenzaPermesso ? new Date(s.scadenzaPermesso) : null,
    });

    // Save classification
    await db
      .update(pratiche)
      .set({
        classificazione: engineResult.classification,
        classificazioneReasons: engineResult.reasons,
        documentiRichiestiOutput: engineResult.required_documents,
        infoMancanti: engineResult.missing_information,
        classificazioneAt: engineResult.evaluated_at,
        classificazioneVersione: engineResult.dataset_version,
        stato: "completata",
        updatedAt: new Date(),
      })
      .where(eq(pratiche.id, praticaId));

    // Send result
    await sendResult(ctx, locale, engineResult);
    s.step = "done";
    return;
  }
}

function sendResult(
  ctx: BotContext,
  locale: Locale,
  result: ReturnType<typeof evaluateWithDataset>
) {
  let title: string;
  let body: string;

  if (result.classification === "LIKELY_CONVERTIBLE") {
    title = t(locale, "result_convertible_title");
    body = t(locale, "result_convertible_body");
  } else if (result.classification === "NOT_CONVERTIBLE_EXAMS") {
    title = t(locale, "result_not_convertible_title");
    body = t(locale, "result_not_convertible_body");
  } else {
    title = t(locale, "result_needs_review_title");
    body = t(locale, "result_needs_review_body");
  }

  const reasonsText =
    result.reasons.length > 0
      ? "\n\n📌 *Motivo:*\n" + result.reasons.map((r: string) => `• ${r}`).join("\n")
      : "";

  let docsText = "";
  if (result.classification === "LIKELY_CONVERTIBLE" && result.required_documents.length > 0) {
    const mandatory = result.required_documents.filter((d: { obbligatorio: boolean }) => d.obbligatorio);
    if (mandatory.length > 0) {
      docsText =
        "\n\n" + t(locale, "result_docs_title") + "\n" +
        mandatory.map((d: { nome: string }, i: number) => `${i + 1}. ${d.nome}`).join("\n");
    }
  }

  return ctx.reply(title + "\n\n" + body + reasonsText + docsText, {
    parse_mode: "Markdown",
  });
}
