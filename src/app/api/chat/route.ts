import { auth } from "@/src/lib/auth/config";
import { db } from "@/src/lib/db";
import {
  pratiche,
  documentiPratica,
  documentiGenerati,
  notePratica,
} from "@/src/lib/db/schema";
import { createTelegramToken } from "@/src/lib/telegram/token";
import Anthropic from "@anthropic-ai/sdk";
import { eq, and, ilike, or, SQL } from "drizzle-orm";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sei l'assistente AI di ConvertoPatenti, una piattaforma gestionale per autoscuole italiane specializzate nella conversione di patenti straniere.

Parli come un esperto del settore, usando il linguaggio delle autoscuole italiane. Sei preciso, professionale e diretto.

Hai accesso completo al gestionale dell'autoscuola: puoi consultare pratiche, aggiornarne lo stato, aggiungere note e fornire link a documenti generati.

TERMINI CHE USI:
- "pratica" = singolo caso di conversione patente
- "candidato" = il cliente/utente che vuole convertire la patente
- "classificazione" = l'esito automatico del sistema (LIKELY_CONVERTIBLE, NOT_CONVERTIBLE_EXAMS, NEEDS_REVIEW)
- "TT2112" = il modello ministeriale per la conversione
- "intake" = raccolta dati dal candidato via Telegram

STATI PRATICHE:
- attesa_candidato = in attesa che il candidato compili il form Telegram
- intake_in_corso = candidato sta compilando
- valutazione = dati raccolti, in attesa di classificazione
- completata = pratica classificata e documentazione pronta
- archiviata = pratica chiusa

CLASSIFICAZIONI:
- LIKELY_CONVERTIBLE = patente probabilmente convertibile senza esami
- NOT_CONVERTIBLE_EXAMS = richiede esami teorici e/o pratici
- NEEDS_REVIEW = mancano informazioni per decidere

Quando mostri link a pratiche o documenti, formattali come link cliccabili in markdown: [testo](url).
Quando elenchi documenti mancanti, sii specifico e pratico.
Rispondi sempre in italiano.`;

// ── Tool definitions ──────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: "cerca_pratiche",
    description:
      "Cerca pratiche nell'autoscuola per nome candidato, stato, paese di rilascio o classificazione. Restituisce lista di pratiche con link.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome: {
          type: "string",
          description: "Nome o cognome del candidato (parziale va bene)",
        },
        stato: {
          type: "string",
          enum: [
            "attesa_candidato",
            "intake_in_corso",
            "valutazione",
            "completata",
            "archiviata",
          ],
          description: "Stato della pratica",
        },
        paese_rilascio: {
          type: "string",
          description: "Paese di rilascio della patente (es. MA, RO, PK)",
        },
        classificazione: {
          type: "string",
          enum: [
            "LIKELY_CONVERTIBLE",
            "NOT_CONVERTIBLE_EXAMS",
            "NEEDS_REVIEW",
          ],
          description: "Classificazione della pratica",
        },
        limit: {
          type: "number",
          description: "Numero massimo di risultati (default 10)",
        },
      },
      required: [],
    },
  },
  {
    name: "leggi_pratica",
    description:
      "Legge tutti i dettagli di una pratica specifica: dati candidato, patente, classificazione, documenti caricati, documenti generati e note.",
    input_schema: {
      type: "object" as const,
      properties: {
        pratica_id: {
          type: "string",
          description: "ID della pratica",
        },
      },
      required: ["pratica_id"],
    },
  },
  {
    name: "aggiorna_stato",
    description: "Aggiorna lo stato di una pratica.",
    input_schema: {
      type: "object" as const,
      properties: {
        pratica_id: {
          type: "string",
          description: "ID della pratica",
        },
        nuovo_stato: {
          type: "string",
          enum: [
            "attesa_candidato",
            "intake_in_corso",
            "valutazione",
            "completata",
            "archiviata",
          ],
          description: "Nuovo stato",
        },
      },
      required: ["pratica_id", "nuovo_stato"],
    },
  },
  {
    name: "aggiungi_nota",
    description: "Aggiunge una nota operatore a una pratica.",
    input_schema: {
      type: "object" as const,
      properties: {
        pratica_id: {
          type: "string",
          description: "ID della pratica",
        },
        testo: {
          type: "string",
          description: "Testo della nota",
        },
      },
      required: ["pratica_id", "testo"],
    },
  },
  {
    name: "aggiorna_note_operatore",
    description:
      "Aggiorna il campo note operatore di una pratica (sostituisce il testo esistente).",
    input_schema: {
      type: "object" as const,
      properties: {
        pratica_id: { type: "string", description: "ID della pratica" },
        note: { type: "string", description: "Nuovo testo delle note operatore" },
      },
      required: ["pratica_id", "note"],
    },
  },
  {
    name: "rimuovi_documento_richiesto",
    description:
      "Rimuove un documento dalla lista dei documenti richiesti di una pratica (es. se il candidato l'ha già consegnato o non è necessario). Usa il campo 'codice' o cerca per corrispondenza parziale sul nome.",
    input_schema: {
      type: "object" as const,
      properties: {
        pratica_id: { type: "string", description: "ID della pratica" },
        documento: {
          type: "string",
          description: "Codice o nome (parziale) del documento da rimuovere, es. 'carta_identita', 'passaporto', 'carta identità'",
        },
      },
      required: ["pratica_id", "documento"],
    },
  },
  {
    name: "crea_pratica",
    description:
      "Crea una nuova pratica nel gestionale per un candidato. Genera automaticamente il link Telegram da mandare al candidato per raccogliere i dati. Restituisce l'ID della pratica e il link.",
    input_schema: {
      type: "object" as const,
      properties: {
        note_iniziali: {
          type: "string",
          description: "Note iniziali opzionali sulla pratica (es. nome candidato, motivo apertura)",
        },
      },
      required: [],
    },
  },
  {
    name: "aggiorna_documenti_richiesti",
    description:
      "Sostituisce l'intera lista dei documenti richiesti di una pratica con una nuova lista. Usa questo tool per aggiungere, modificare o riordinare documenti in modo preciso.",
    input_schema: {
      type: "object" as const,
      properties: {
        pratica_id: { type: "string", description: "ID della pratica" },
        documenti: {
          type: "array",
          description: "Nuova lista completa di documenti richiesti (array di oggetti con gli stessi campi dell'originale)",
          items: { type: "object" },
        },
      },
      required: ["pratica_id", "documenti"],
    },
  },
];

// ── Tool execution ────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  autoscuolaId: string,
  operatoreId: string
): Promise<string> {
  const appUrl =
    process.env.APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  if (name === "cerca_pratiche") {
    const { nome, stato, paese_rilascio, classificazione, limit = 10 } =
      input as {
        nome?: string;
        stato?: string;
        paese_rilascio?: string;
        classificazione?: string;
        limit?: number;
      };

    const conditions: SQL[] = [eq(pratiche.autoscuolaId, autoscuolaId)];
    if (stato) conditions.push(eq(pratiche.stato, stato));
    if (paese_rilascio)
      conditions.push(eq(pratiche.paeseRilascio, paese_rilascio));
    if (classificazione)
      conditions.push(eq(pratiche.classificazione, classificazione));
    if (nome) {
      const tokens = nome.trim().split(/\s+/);
      if (tokens.length >= 2) {
        // "Marco Prova" → cerca (nome=Marco AND cognome=Prova) OR (nome=Prova AND cognome=Marco)
        // oppure ognuno dei token in uno dei due campi
        conditions.push(
          or(
            and(
              ilike(pratiche.candidatoNome, `%${tokens[0]}%`),
              ilike(pratiche.candidatoCognome, `%${tokens[1]}%`)
            ),
            and(
              ilike(pratiche.candidatoNome, `%${tokens[1]}%`),
              ilike(pratiche.candidatoCognome, `%${tokens[0]}%`)
            ),
            ilike(pratiche.candidatoNome, `%${nome}%`),
            ilike(pratiche.candidatoCognome, `%${nome}%`)
          )!
        );
      } else {
        conditions.push(
          or(
            ilike(pratiche.candidatoNome, `%${nome}%`),
            ilike(pratiche.candidatoCognome, `%${nome}%`)
          )!
        );
      }
    }

    const rows = await db
      .select({
        id: pratiche.id,
        nome: pratiche.candidatoNome,
        cognome: pratiche.candidatoCognome,
        stato: pratiche.stato,
        classificazione: pratiche.classificazione,
        paeseRilascio: pratiche.paeseRilascio,
        categoriaPatente: pratiche.categoriaPatente,
        createdAt: pratiche.createdAt,
      })
      .from(pratiche)
      .where(and(...conditions))
      .limit(Math.min(Number(limit), 50))
      .orderBy(pratiche.createdAt);

    if (rows.length === 0) return "Nessuna pratica trovata con i filtri indicati.";

    const result = rows.map((r) => ({
      id: r.id,
      candidato: `${r.cognome ?? ""} ${r.nome ?? ""}`.trim() || "(senza nome)",
      stato: r.stato,
      classificazione: r.classificazione ?? "non classificata",
      paese: r.paeseRilascio ?? "—",
      categoria: r.categoriaPatente ?? "—",
      link: `${appUrl}/pratiche/${r.id}`,
      creata: r.createdAt?.toLocaleDateString("it-IT"),
    }));

    return JSON.stringify(result, null, 2);
  }

  if (name === "leggi_pratica") {
    const { pratica_id } = input as { pratica_id: string };

    const [p] = await db
      .select()
      .from(pratiche)
      .where(and(eq(pratiche.id, pratica_id), eq(pratiche.autoscuolaId, autoscuolaId)))
      .limit(1);

    if (!p) return "Pratica non trovata o non appartiene a questa autoscuola.";

    const docs = await db
      .select({
        id: documentiPratica.id,
        tipo: documentiPratica.tipoDocumento,
        nome: documentiPratica.nomeOriginale,
        caricatoDa: documentiPratica.caricatoDa,
        url: documentiPratica.storageKey,
        createdAt: documentiPratica.createdAt,
      })
      .from(documentiPratica)
      .where(eq(documentiPratica.praticaId, pratica_id));

    const docsGen = await db
      .select({
        id: documentiGenerati.id,
        tipo: documentiGenerati.tipoDocumento,
        nome: documentiGenerati.nomeFile,
        url: documentiGenerati.storageKey,
        versione: documentiGenerati.versione,
      })
      .from(documentiGenerati)
      .where(eq(documentiGenerati.praticaId, pratica_id));

    const note = await db
      .select({
        testo: notePratica.testo,
        createdAt: notePratica.createdAt,
      })
      .from(notePratica)
      .where(eq(notePratica.praticaId, pratica_id))
      .orderBy(notePratica.createdAt);

    return JSON.stringify(
      {
        id: p.id,
        link: `${appUrl}/pratiche/${p.id}`,
        stato: p.stato,
        classificazione: p.classificazione ?? "non classificata",
        classificazione_reasons: p.classificazioneReasons,
        documenti_richiesti: p.documentiRichiestiOutput,
        info_mancanti: p.infoMancanti,
        candidato: {
          nome: p.candidatoNome,
          cognome: p.candidatoCognome,
          sesso: p.candidatoSesso,
          nascita: p.candidatoNascita,
          nazionalita: p.candidatoNazionalita,
          codice_fiscale: p.candidatoCodiceFiscale,
        },
        patente: {
          paese_rilascio: p.paeseRilascio,
          categoria: p.categoriaPatente,
          numero: p.numeroPatente,
          data_rilascio: p.dataRilascioPatente,
          data_scadenza: p.dataScadenzaPatente,
          valida: p.patenteValida,
        },
        residenza: {
          prima_residenza: p.dataPrimaResidenza,
          tipo_soggiorno: p.tipoSoggiorno,
          scadenza_permesso: p.scadenzaPermesso,
          comune: p.residenzaComune,
          provincia: p.residenzaProvincia,
        },
        tipo_istanza: p.tipoIstanza,
        note_operatore: p.noteOperatore,
        telegram_token: p.telegramToken,
        creata: p.createdAt?.toLocaleDateString("it-IT"),
        documenti_caricati: docs,
        documenti_generati: docsGen,
        note_storico: note,
      },
      null,
      2
    );
  }

  if (name === "aggiorna_stato") {
    const { pratica_id, nuovo_stato } = input as {
      pratica_id: string;
      nuovo_stato: string;
    };

    const [existing] = await db
      .select({ id: pratiche.id, stato: pratiche.stato })
      .from(pratiche)
      .where(and(eq(pratiche.id, pratica_id), eq(pratiche.autoscuolaId, autoscuolaId)))
      .limit(1);

    if (!existing) return "Pratica non trovata o non appartiene a questa autoscuola.";

    await db
      .update(pratiche)
      .set({ stato: nuovo_stato, updatedAt: new Date() })
      .where(eq(pratiche.id, pratica_id));

    return `Stato aggiornato da "${existing.stato}" a "${nuovo_stato}". Link pratica: ${appUrl}/pratiche/${pratica_id}`;
  }

  if (name === "aggiungi_nota") {
    const { pratica_id, testo } = input as {
      pratica_id: string;
      testo: string;
    };

    const [existing] = await db
      .select({ id: pratiche.id })
      .from(pratiche)
      .where(and(eq(pratiche.id, pratica_id), eq(pratiche.autoscuolaId, autoscuolaId)))
      .limit(1);

    if (!existing) return "Pratica non trovata o non appartiene a questa autoscuola.";

    await db.insert(notePratica).values({
      praticaId: pratica_id,
      operatoreId: operatoreId,
      testo,
    });

    return `Nota aggiunta con successo alla pratica. Link pratica: ${appUrl}/pratiche/${pratica_id}`;
  }

  if (name === "aggiorna_note_operatore") {
    const { pratica_id, note } = input as {
      pratica_id: string;
      note: string;
    };

    const [existing] = await db
      .select({ id: pratiche.id })
      .from(pratiche)
      .where(and(eq(pratiche.id, pratica_id), eq(pratiche.autoscuolaId, autoscuolaId)))
      .limit(1);

    if (!existing) return "Pratica non trovata o non appartiene a questa autoscuola.";

    await db
      .update(pratiche)
      .set({ noteOperatore: note, updatedAt: new Date() })
      .where(eq(pratiche.id, pratica_id));

    return `Note operatore aggiornate. Link pratica: ${appUrl}/pratiche/${pratica_id}`;
  }

  if (name === "rimuovi_documento_richiesto") {
    const { pratica_id, documento } = input as { pratica_id: string; documento: string };

    const [p] = await db
      .select({ id: pratiche.id, documentiRichiestiOutput: pratiche.documentiRichiestiOutput })
      .from(pratiche)
      .where(and(eq(pratiche.id, pratica_id), eq(pratiche.autoscuolaId, autoscuolaId)))
      .limit(1);

    if (!p) return "Pratica non trovata o non appartiene a questa autoscuola.";

    const docs = (p.documentiRichiestiOutput as Record<string, unknown>[]) ?? [];
    const keyword = documento.toLowerCase().replace(/[_\s]/g, "");

    const filtrati = docs.filter((d) => {
      const codice = String(d.codice ?? "").toLowerCase().replace(/[_\s]/g, "");
      const nome = String(d.nome ?? d.nome_it ?? d.nomeIt ?? "").toLowerCase().replace(/[_\s]/g, "");
      return !codice.includes(keyword) && !nome.includes(keyword);
    });

    if (filtrati.length === docs.length) {
      return `Nessun documento trovato con il termine "${documento}". Documenti presenti: ${docs.map((d) => d.codice ?? d.nome ?? d.nomeIt).join(", ")}`;
    }

    const rimossi = docs.length - filtrati.length;
    await db
      .update(pratiche)
      .set({ documentiRichiestiOutput: filtrati, updatedAt: new Date() })
      .where(eq(pratiche.id, pratica_id));

    return `✅ Rimossi ${rimossi} documento/i corrispondenti a "${documento}". Rimangono ${filtrati.length} documenti richiesti. La pagina mostrerà subito la lista aggiornata. Link pratica: ${appUrl}/pratiche/${pratica_id}`;
  }

  if (name === "aggiorna_documenti_richiesti") {
    const { pratica_id, documenti } = input as { pratica_id: string; documenti: Record<string, unknown>[] };

    const [existing] = await db
      .select({ id: pratiche.id })
      .from(pratiche)
      .where(and(eq(pratiche.id, pratica_id), eq(pratiche.autoscuolaId, autoscuolaId)))
      .limit(1);

    if (!existing) return "Pratica non trovata o non appartiene a questa autoscuola.";

    await db
      .update(pratiche)
      .set({ documentiRichiestiOutput: documenti, updatedAt: new Date() })
      .where(eq(pratiche.id, pratica_id));

    return `✅ Lista documenti richiesti aggiornata (${documenti.length} documenti). Link pratica: ${appUrl}/pratiche/${pratica_id}`;
  }

  if (name === "crea_pratica") {
    const { note_iniziali } = input as { note_iniziali?: string };
    const token = createTelegramToken();
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "ConvertoPatentiBot";

    const [nuova] = await db
      .insert(pratiche)
      .values({
        autoscuolaId,
        operatoreId,
        telegramToken: token,
        stato: "attesa_candidato",
        noteOperatore: note_iniziali ?? null,
      })
      .returning({ id: pratiche.id });

    const telegramLink = `https://t.me/${botUsername}?start=${token}`;
    return JSON.stringify({
      pratica_id: nuova.id,
      link_pratica: `${appUrl}/pratiche/${nuova.id}`,
      link_telegram_candidato: telegramLink,
      messaggio: `Pratica creata! Manda questo link al candidato su Telegram: ${telegramLink}`,
    });
  }

  return "Tool non riconosciuto.";
}

// ── Agentic loop ──────────────────────────────────────────────────────────────

async function runAgentLoop(
  messages: Anthropic.MessageParam[],
  autoscuolaId: string,
  operatoreId: string
): Promise<string> {
  const MAX_TURNS = 8;
  let currentMessages = [...messages];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools,
      messages: currentMessages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock ? (textBlock as Anthropic.TextBlock).text : "";
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b) => b.type === "tool_use"
      ) as Anthropic.ToolUseBlock[];

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            autoscuolaId,
            operatoreId
          ),
        }))
      );

      currentMessages = [
        ...currentMessages,
        { role: "assistant" as const, content: response.content },
        { role: "user" as const, content: toolResults },
      ];
      continue;
    }

    // max_tokens or other stop
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock ? (textBlock as Anthropic.TextBlock).text : "";
  }

  return "Ho raggiunto il limite di operazioni. Riprova con una richiesta più specifica.";
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Non autenticato" }), {
      status: 401,
    });
  }

  const { messages } = (await req.json()) as {
    messages: Anthropic.MessageParam[];
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Messaggi mancanti" }), {
      status: 400,
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const reply = await runAgentLoop(
          messages,
          session.user.autoscuolaId,
          session.user.id
        );

        // Stream char by char for typewriter effect
        for (const char of reply) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "text", text: char })}\n\n`
            )
          );
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Errore sconosciuto";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: msg })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
