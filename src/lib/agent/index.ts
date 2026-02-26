import Anthropic from "@anthropic-ai/sdk";
import { agentTools } from "./tools";
import { extractTextFromDocx } from "./extractors/docx";
import { extractTextFromPdf } from "./extractors/pdf";
import { extractTextFromHtml, extractTablesFromHtml } from "./extractors/html";
import { z } from "zod";

const SYSTEM_PROMPT = `Sei un assistente specializzato nell'analisi di documenti normativi italiani relativi alla conversione di patenti di guida estere in Italia.

Il tuo compito è ESTRARRE e STRUTTURARE informazioni dai documenti forniti.
NON devi interpretare la legge o fare classificazioni legali — solo estrarre dati.

Regole operative:
1. Estrai SOLO le informazioni presenti nel documento — non aggiungere conoscenze proprie
2. Quando un'informazione è ambigua, usa sempre report_uncertainty
3. Normalizza: date in formato YYYY-MM-DD, codici paese in ISO 3166-1 alpha-2, categorie patente in maiuscolo (B, A, C, D, ecc.)
4. Indica sempre il tuo livello di confidenza (high/medium/low)
5. Cita il testo originale nelle extraction_notes quando rilevante
6. Se trovi informazioni contrastanti, segnalale come uncertainty

Il tuo output verrà revisionato da un operatore umano prima di essere applicato.`;

export interface AgentExtractionResult {
  extracted_countries: unknown[];
  extracted_agreements: unknown[];
  extracted_documents: unknown[];
  uncertainties: unknown[];
  confidence_overall: "high" | "medium" | "low";
  review_required: boolean;
  agent_notes: string;
  raw_tool_calls: unknown[];
}

export async function runExtractionAgent(
  content: string,
  sourceType: string
): Promise<AgentExtractionResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for AI agent");
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const userMessage = `Analizza il seguente documento normativo (tipo: ${sourceType}) ed estrai tutte le informazioni rilevanti sulla conversione di patenti estere in Italia.

Usa gli strumenti disponibili per strutturare i dati estratti.

DOCUMENTO:
---
${content.slice(0, 80000)} ${content.length > 80000 ? "\n[... documento troncato per limite token ...]" : ""}
---

Estrai tutti i dati che riesci a trovare:
1. Lista paesi con il loro status (UE/SEE, accordo bilaterale, nessun accordo)
2. Dettagli di eventuali accordi bilaterali (categorie, condizioni temporali, scadenze)
3. Documenti richiesti per zona/paese
4. Segnala qualsiasi ambiguità con report_uncertainty`;

  const toolCalls: unknown[] = [];
  const countries: unknown[] = [];
  const agreements: unknown[] = [];
  const documents: unknown[] = [];
  const uncertainties: unknown[] = [];

  // Run the agent with tool use
  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  let continueLoop = true;
  let iterations = 0;
  const MAX_ITERATIONS = 10;

  while (continueLoop && iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: agentTools,
      messages,
    });

    toolCalls.push(response);

    if (response.stop_reason === "end_turn") {
      continueLoop = false;
      break;
    }

    if (response.stop_reason === "tool_use") {
      const assistantMessage: Anthropic.MessageParam = {
        role: "assistant",
        content: response.content,
      };
      messages.push(assistantMessage);

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        const toolInput = block.input as Record<string, unknown>;

        // Collect results by tool name
        if (block.name === "extract_countries") {
          const c = toolInput.countries as unknown[];
          countries.push(...c);
          toolResults.push({
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: `Estratti ${c.length} paesi`,
          });
        } else if (block.name === "extract_bilateral_agreement") {
          agreements.push(toolInput);
          toolResults.push({
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: `Accordo bilaterale estratto per ${toolInput.country_iso}`,
          });
        } else if (block.name === "extract_required_documents") {
          documents.push(toolInput);
          toolResults.push({
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: `Documenti estratti`,
          });
        } else if (block.name === "report_uncertainty") {
          uncertainties.push(toolInput);
          toolResults.push({
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: `Incertezza registrata: ${toolInput.topic}`,
          });
        }
      }

      messages.push({
        role: "user",
        content: toolResults,
      });
    } else {
      continueLoop = false;
    }
  }

  // Calculate overall confidence
  const allConfidences = [
    ...(countries as { confidence?: string }[]).map((c) => c.confidence),
    ...(agreements as { confidence?: string }[]).map((a) => a.confidence),
  ].filter(Boolean);

  let confidence_overall: "high" | "medium" | "low" = "medium";
  if (allConfidences.every((c) => c === "high")) {
    confidence_overall = "high";
  } else if (allConfidences.some((c) => c === "low")) {
    confidence_overall = "low";
  }

  return {
    extracted_countries: countries,
    extracted_agreements: agreements,
    extracted_documents: documents,
    uncertainties,
    confidence_overall,
    review_required: uncertainties.length > 0 || confidence_overall !== "high",
    agent_notes: `Iterazioni: ${iterations}. Trovati: ${countries.length} paesi, ${agreements.length} accordi, ${uncertainties.length} incertezze.`,
    raw_tool_calls: toolCalls,
  };
}

/**
 * Extract text from a file buffer based on MIME type
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    return extractTextFromPdf(buffer);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(".docx")
  ) {
    return extractTextFromDocx(buffer);
  }

  if (
    mimeType === "text/html" ||
    filename.endsWith(".html") ||
    filename.endsWith(".htm")
  ) {
    return extractTextFromHtml(buffer.toString("utf-8"));
  }

  if (mimeType === "text/plain" || filename.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
