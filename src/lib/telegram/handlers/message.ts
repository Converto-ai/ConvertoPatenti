import type { BotContext } from "../types";
import type { Locale } from "../i18n/strings";
import { t } from "../i18n/strings";
import { db, documentiPratica } from "@/src/lib/db";
import { loadDataset } from "@/src/lib/rules-engine";
import { parseDate, formatDateIt } from "../utils/date";
import { findCountry } from "../utils/country-lookup";

const LANG_MAP: Record<string, Locale> = {
  "🇮🇹 Italiano": "it", "🇬🇧 English": "en", "🇫🇷 Français": "fr",
  "🇸🇦 العربية": "ar", "🇪🇸 Español": "es", "🇵🇹 Português": "pt",
  "🇷🇴 Română": "ro", "🇺🇦 Українська": "uk", "🇷🇺 Русский": "ru",
  "🇨🇳 中文": "zh", "🇵🇰 اردو": "ur", "🇵🇭 Filipino": "tl",
};

const CATEGORY_MAP: Record<string, string> = {
  "A — Moto": "A", "A1 — Moto piccola": "A1", "A2 — Moto media": "A2",
  "B — Auto": "B", "BE — Auto+rimorchio": "BE", "B1 — Quadricicli": "B1",
  "C — Camion": "C", "C1 — Cam. leggero": "C1", "D — Bus": "D",
};


export async function handleMessage(ctx: BotContext) {
  const s = ctx.session;
  const text = ctx.message?.text?.trim() ?? "";
  const locale = s.locale ?? "it";

  console.log(`[Bot] step=${s.step}, text="${text.slice(0, 30)}"`);

  switch (s.step) {
    // ── LANGUAGE ──
    case "language": {
      s.locale = LANG_MAP[text] ?? "it";
      s.step = "intro";
      const l = s.locale;
      await ctx.reply(
        t(l, "intro_message", s.autoscuolaNome ?? "Autoscuola") + "\n\n" + t(l, "privacy_notice"),
        {
          parse_mode: "Markdown",
          reply_markup: {
            keyboard: [[{ text: t(l, "intro_start") }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
      return;
    }

    // ── INTRO ──
    case "intro": {
      s.step = "nome";
      await ctx.reply(t(locale, "step_nome_q"), {
        parse_mode: "Markdown",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    // ── NOME ──
    case "nome": {
      const [nome, ...rest] = text.split(" ");
      s.candidatoNome = nome;
      s.candidatoCognome = rest.join(" ") || "";
      await ctx.reply(t(locale, "step_nome_confirm", text), { parse_mode: "Markdown" });
      s.step = "sesso";
      await ctx.reply(t(locale, "step_sesso_q"), {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            { text: t(locale, "step_sesso_m"), callback_data: "sesso:M" },
            { text: t(locale, "step_sesso_f"), callback_data: "sesso:F" },
          ]],
        },
      });
      return;
    }

    // ── NASCITA ──
    case "nascita": {
      const d = parseDate(text);
      if (!d) {
        await ctx.reply(t(locale, "step_data_invalid"), { parse_mode: "Markdown" });
        return;
      }
      s.candidatoNascita = d.toISOString();
      s.step = "luogo_nascita";
      await ctx.reply(t(locale, "step_luogo_nascita_q"), {
        parse_mode: "Markdown",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    // ── LUOGO NASCITA ──
    case "luogo_nascita": {
      const parts = text.split(",").map((p) => p.trim());
      s.candidatoLuogoNascita = parts[0];
      s.candidatoStatoNascita = parts[1] ?? "";
      s.step = "codice_fiscale";
      await ctx.reply(t(locale, "step_codice_fiscale_q"), {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [[{ text: t(locale, "step_codice_fiscale_skip") }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      return;
    }

    // ── CODICE FISCALE ──
    case "codice_fiscale": {
      if (text !== t(locale, "step_codice_fiscale_skip")) {
        s.candidatoCodiceFiscale = text.toUpperCase().replace(/\s/g, "");
      }
      s.step = "paese";
      await ctx.reply(t(locale, "step_paese_q"), {
        parse_mode: "Markdown",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    // ── PAESE ──
    case "paese": {
      const found = findCountry(text);
      if (found) {
        s.paeseIso = found.iso;
        s.paeseNome = found.name_it;
        s.step = "paese_confirm";
        await ctx.reply(t(locale, "step_paese_found", found.name_it), {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[
              { text: t(locale, "step_paese_confirm_yes"), callback_data: "paese:yes" },
              { text: t(locale, "step_paese_confirm_no"), callback_data: "paese:no" },
            ]],
          },
        });
      } else {
        await ctx.reply(t(locale, "step_paese_not_found"), { parse_mode: "Markdown" });
      }
      return;
    }

    // ── CATEGORIA ──
    case "categoria": {
      s.categoriaPatente = CATEGORY_MAP[text] ?? text.split(" ")[0].toUpperCase();
      s.step = "tipo_istanza";
      await ctx.reply(t(locale, "step_tipo_istanza_q"), {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: t(locale, "step_tipo_istanza_conversione"), callback_data: "tipo_istanza:conversione" }],
            [{ text: t(locale, "step_tipo_istanza_esami"), callback_data: "tipo_istanza:esami" }],
            [{ text: t(locale, "step_tipo_istanza_riclassificazione"), callback_data: "tipo_istanza:riclassificazione" }],
          ],
        },
      });
      return;
    }

    // ── DATA RILASCIO ──
    case "data_rilascio": {
      const d = parseDate(text);
      if (!d) {
        await ctx.reply(t(locale, "step_data_invalid"), { parse_mode: "Markdown" });
        return;
      }
      s.dataRilascio = d.toISOString();
      s.step = "scadenza";
      await ctx.reply(t(locale, "step_scadenza_q"), {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: t(locale, "step_scadenza_valid"), callback_data: "valid:yes" },
              { text: t(locale, "step_scadenza_expired"), callback_data: "valid:no" },
            ],
            [{ text: t(locale, "step_scadenza_unknown"), callback_data: "valid:unknown" }],
          ],
        },
      });
      return;
    }

    // ── SCADENZA DATE ──
    case "scadenza_date": {
      const d = parseDate(text);
      s.dataScadenza = d?.toISOString() ?? undefined;
      s.step = "residenza";
      await ctx.reply(t(locale, "step_residenza_q"), {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [[{ text: t(locale, "step_residenza_no_residence") }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      return;
    }

    // ── RESIDENZA ──
    case "residenza": {
      if (text !== t(locale, "step_residenza_no_residence")) {
        const d = parseDate(text);
        s.dataPrimaResidenza = d?.toISOString() ?? undefined;
      }

      // Check if EU
      const dataset = loadDataset();
      const countryData = dataset.countries.find((c) => c.iso === s.paeseIso);
      s.isEuEea = countryData?.is_eu_eea ?? false;

      if (!s.isEuEea) {
        s.step = "soggiorno";
        await ctx.reply(t(locale, "step_soggiorno_q"), {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: t(locale, "step_soggiorno_pds"), callback_data: "soggiorno:permesso_soggiorno" }],
              [{ text: t(locale, "step_soggiorno_carta"), callback_data: "soggiorno:carta_soggiorno" }],
              [{ text: t(locale, "step_soggiorno_cittadino"), callback_data: "soggiorno:cittadino_eu" }],
              [{ text: t(locale, "step_soggiorno_no_doc"), callback_data: "soggiorno:none" }],
            ],
          },
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

    // ── SOGGIORNO SCADENZA ──
    case "soggiorno_scadenza": {
      const d = parseDate(text);
      s.scadenzaPermesso = d?.toISOString() ?? undefined;
      s.step = "residenza_comune";
      await ctx.reply(t(locale, "step_residenza_comune_q"), {
        parse_mode: "Markdown",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    // ── RESIDENZA COMUNE ──
    case "residenza_comune": {
      const parts = text.split(",").map((p) => p.trim());
      s.residenzaComune = parts[0];
      s.residenzaProvincia = parts[1] ?? "";
      s.step = "residenza_indirizzo";
      await ctx.reply(t(locale, "step_residenza_indirizzo_q"), {
        parse_mode: "Markdown",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    // ── RESIDENZA INDIRIZZO ──
    case "residenza_indirizzo": {
      // Parse "Via Roma 10, 20121" → indirizzo, CAP
      // Or "Via Roma 10" → just indirizzo
      const commaIdx = text.lastIndexOf(",");
      if (commaIdx > 0) {
        const afterComma = text.slice(commaIdx + 1).trim();
        if (/^\d{5}/.test(afterComma)) {
          // Last part is CAP
          s.residenzaCap = afterComma.slice(0, 5);
          const viaPart = text.slice(0, commaIdx).trim();
          // Split via from civico
          const viaMatch = viaPart.match(/^(.*?)\s+(\d+\S*)$/);
          if (viaMatch) {
            s.residenzaIndirizzo = viaMatch[1];
            s.residenzaCivico = viaMatch[2];
          } else {
            s.residenzaIndirizzo = viaPart;
          }
        } else {
          s.residenzaIndirizzo = text;
        }
      } else {
        const viaMatch = text.match(/^(.*?)\s+(\d+\S*)$/);
        if (viaMatch) {
          s.residenzaIndirizzo = viaMatch[1];
          s.residenzaCivico = viaMatch[2];
        } else {
          s.residenzaIndirizzo = text;
        }
      }
      s.step = "foto";
      await ctx.reply(
        t(locale, "step_foto_q") + "\n\n" + t(locale, "step_foto_hint"),
        { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
      );
      return;
    }

    // ── FOTO ──
    case "foto": {
      if (ctx.message?.photo) {
        const photo = ctx.message.photo.at(-1);
        if (photo && s.praticaId && s.autoscuolaId) {
          try {
            await downloadAndStoreTelegramFile(photo.file_id, s.praticaId, s.autoscuolaId);
            await ctx.reply(t(locale, "step_foto_received"), { parse_mode: "Markdown" });
          } catch {
            await ctx.reply("⚠️ Impossibile salvare la foto. Procediamo comunque.");
          }
        }
      }
      // Show summary regardless
      s.step = "riepilogo";
      await sendSummary(ctx);
      return;
    }

    default:
      // Ignore messages when idle or in an unknown step
      return;
  }
}

async function sendSummary(ctx: BotContext) {
  const s = ctx.session;
  const locale = s.locale ?? "it";
  const dr = s.dataRilascio ? new Date(s.dataRilascio) : null;
  const ds = s.dataScadenza ? new Date(s.dataScadenza) : null;
  const dres = s.dataPrimaResidenza ? new Date(s.dataPrimaResidenza) : null;

  const dn = s.candidatoNascita ? new Date(s.candidatoNascita) : null;

  const lines = [
    `👤 *Nome:* ${s.candidatoNome ?? ""} ${s.candidatoCognome ?? ""}`,
    `⚧ *Sesso:* ${s.candidatoSesso ?? "—"}`,
    `🎂 *Nascita:* ${dn ? formatDateIt(dn) : "—"}`,
    `📍 *Luogo nascita:* ${[s.candidatoLuogoNascita, s.candidatoStatoNascita].filter(Boolean).join(", ") || "—"}`,
    s.candidatoCodiceFiscale ? `🆔 *Cod. Fiscale:* ${s.candidatoCodiceFiscale}` : "",
    `🌍 *Paese patente:* ${s.paeseNome ?? "—"}`,
    `📋 *Categoria:* ${s.categoriaPatente ?? "—"}`,
    s.tipoIstanza ? `📄 *Tipo istanza:* ${{ conversione: "Conversione/duplicato", esami: "Esami (foglio rosa)", riclassificazione: "Riclassificazione" }[s.tipoIstanza] ?? s.tipoIstanza}` : "",
    `📅 *Data rilascio:* ${dr ? formatDateIt(dr) : "—"}`,
    `✅ *Patente valida:* ${s.patenteValida === true ? "Sì" : s.patenteValida === false ? "No" : "Non specificato"}`,
  ].filter(Boolean);
  if (ds) lines.push(`📅 *Scadenza:* ${formatDateIt(ds)}`);
  lines.push(`🏠 *Residenza dal:* ${dres ? formatDateIt(dres) : "Non ancora registrata"}`);
  if (s.residenzaComune) {
    const addr = [s.residenzaIndirizzo, s.residenzaCivico].filter(Boolean).join(" ");
    const city = [s.residenzaComune, s.residenzaProvincia].filter(Boolean).join(" (") + (s.residenzaProvincia ? ")" : "");
    lines.push(`🏢 *Indirizzo:* ${addr ? addr + ", " : ""}${city}${s.residenzaCap ? " " + s.residenzaCap : ""}`);
  }
  if (s.tipoSoggiorno) {
    const map: Record<string, string> = {
      permesso_soggiorno: "Permesso di soggiorno",
      carta_soggiorno: "Carta di soggiorno UE",
      cittadino_eu: "Cittadinanza italiana/UE",
    };
    lines.push(`📄 *Soggiorno:* ${map[s.tipoSoggiorno] ?? s.tipoSoggiorno}`);
  }

  await ctx.reply(t(locale, "step_riepilogo_title") + "\n\n" + lines.join("\n"), {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: t(locale, "step_riepilogo_confirm"), callback_data: "confirm:yes" },
        { text: t(locale, "step_riepilogo_modify"), callback_data: "confirm:modify" },
      ]],
    },
  });
}

async function downloadAndStoreTelegramFile(
  fileId: string,
  praticaId: string,
  autoscuolaId: string
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const fileInfoRes = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
  );
  const fileInfo = (await fileInfoRes.json()) as {
    ok: boolean;
    result: { file_path?: string };
  };
  if (!fileInfo.ok || !fileInfo.result.file_path) {
    throw new Error("Failed to get file info");
  }

  const fileRes = await fetch(
    `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`
  );
  if (!fileRes.ok) throw new Error("Failed to download file");
  const fileBuffer = await fileRes.arrayBuffer();

  const ext = fileInfo.result.file_path.split(".").pop() ?? "jpg";
  const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
  const fileName = `patente_${Date.now()}.${ext}`;
  const blobPath = `pratiche/${praticaId}/${fileName}`;

  let storageUrl = blobPath;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(blobPath, Buffer.from(fileBuffer), {
      access: "public",
      contentType,
    });
    storageUrl = blob.url;
  }

  await db.insert(documentiPratica).values({
    praticaId,
    autoscuolaId,
    nomeOriginale: fileName,
    tipoDocumento: "foto_patente",
    storageKey: storageUrl,
    mimeType: contentType,
    caricatoDa: "candidato_telegram",
  });
}

export { sendSummary };
