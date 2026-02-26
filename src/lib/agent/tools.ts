import type Anthropic from "@anthropic-ai/sdk";

export const agentTools: Anthropic.Tool[] = [
  {
    name: "extract_countries",
    description:
      "Estrai la lista dei paesi con il loro status normativo per la conversione patente in Italia (UE/SEE, accordo bilaterale, nessun accordo)",
    input_schema: {
      type: "object" as const,
      properties: {
        countries: {
          type: "array" as const,
          items: {
            type: "object" as const,
            required: ["iso", "name_it", "zone"],
            properties: {
              iso: {
                type: "string" as const,
                description: "Codice ISO 3166-1 alpha-2 (es. MA, DE, BR)",
              },
              name_it: {
                type: "string" as const,
                description: "Nome del paese in italiano",
              },
              name_en: { type: "string" as const },
              zone: {
                type: "string" as const,
                enum: ["eu_eea", "bilateral_agreement", "no_agreement"],
              },
              notes: {
                type: "string" as const,
                description: "Note specifiche (opzionale)",
              },
            },
          },
        },
        confidence: {
          type: "string" as const,
          enum: ["high", "medium", "low"],
          description: "Livello di confidenza nell'estrazione",
        },
        extraction_notes: {
          type: "string" as const,
          description: "Note sul processo di estrazione, ambiguità trovate",
        },
      },
      required: ["countries", "confidence"],
    },
  },
  {
    name: "extract_bilateral_agreement",
    description:
      "Estrai i dettagli di un accordo bilaterale tra Italia e un paese specifico",
    input_schema: {
      type: "object" as const,
      required: ["country_iso", "active", "categories"],
      properties: {
        country_iso: { type: "string" as const },
        active: { type: "boolean" as const },
        effective_date: {
          type: "string" as const,
          description: "Data di entrata in vigore in formato YYYY-MM-DD, o null",
        },
        expiry_date: {
          type: "string" as const,
          description: "Data di scadenza in formato YYYY-MM-DD, o null se senza scadenza",
        },
        categories: {
          type: "array" as const,
          items: { type: "string" as const },
          description: "Categorie patente coperte (es: ['B', 'A'])",
        },
        temporal_condition: {
          type: "string" as const,
          enum: ["rilascio_ante_residenza", "entro_anni_residenza", "nessuna"],
        },
        years_from_residency: {
          type: "number" as const,
          description: "Solo se temporal_condition = entro_anni_residenza",
        },
        requires_theory_exam: { type: "boolean" as const },
        requires_practical_exam: { type: "boolean" as const },
        legal_reference: {
          type: "string" as const,
          description: "Riferimento normativo (es. 'GU n.123 del 01/01/2020')",
        },
        confidence: {
          type: "string" as const,
          enum: ["high", "medium", "low"],
        },
        extraction_notes: { type: "string" as const },
      },
    },
  },
  {
    name: "extract_required_documents",
    description:
      "Estrai la lista di documenti richiesti per una categoria di candidati (zona o paese specifico)",
    input_schema: {
      type: "object" as const,
      properties: {
        zone: {
          type: "string" as const,
          enum: ["eu_eea", "bilateral_agreement", "no_agreement"],
        },
        country_iso: {
          type: "string" as const,
          description: "ISO paese se specifico per quel paese",
        },
        documents: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              name_it: { type: "string" as const },
              mandatory: { type: "boolean" as const },
              conditional_note: { type: "string" as const },
            },
          },
        },
        confidence: {
          type: "string" as const,
          enum: ["high", "medium", "low"],
        },
      },
    },
  },
  {
    name: "report_uncertainty",
    description:
      "Segnala quando un'informazione è ambigua, mancante o contraddittoria nel documento",
    input_schema: {
      type: "object" as const,
      required: ["topic", "reason"],
      properties: {
        topic: {
          type: "string" as const,
          description: "Argomento dell'incertezza (es. 'Condizione temporale accordo Marocco')",
        },
        reason: {
          type: "string" as const,
          description: "Perché c'è incertezza",
        },
        raw_text: {
          type: "string" as const,
          description: "Testo originale che ha causato l'incertezza",
        },
      },
    },
  },
];
