# AGENT_DESIGN.md — ConvertoPatenti

## Principio di separazione responsabilità

```
AI Agent: legge, estrae, struttura → propone
Rules Engine: decide → classificazione legale

L'AI agent NON decide la legge.
L'operatore umano approva ogni aggiornamento dataset.
```

---

## Obiettivi dell'AI Agent

1. **Estrazione**: da DOCX/PDF/HTML → JSON strutturato (paesi, accordi, condizioni, documenti)
2. **Normalizzazione**: nomi paese → ISO, date → ISO 8601, categorie → array standardizzato
3. **Diff report**: confronto nuova fonte vs dataset corrente → evidenzia cambiamenti
4. **Identificazione sezioni**: trova le parti rilevanti in documenti complessi
5. **Proposta aggiornamento**: genera il patch da applicare al dataset

---

## Stack tecnico agent

| Componente | Scelta | Motivazione |
|-----------|--------|-------------|
| LLM | Claude claude-sonnet-4-6 (Anthropic) | Tool use avanzato, ragionamento su testo normativo italiano, structured output affidabile |
| Tool use pattern | Anthropic SDK tool_use | Permette all'agent di "chiamare" funzioni strutturate |
| PDF parsing | pdf-parse | Estrazione testo grezza |
| DOCX parsing | mammoth | Estrazione testo + struttura base da .docx |
| HTML parsing | Cheerio | Navigazione DOM server-side |
| Validation | Zod | Schema validation dell'output agent |

---

## Tool definitions (Claude API)

```typescript
const agentTools = [
  {
    name: "extract_countries",
    description: "Estrai la lista dei paesi con il loro status normativo (UE/SEE, accordo bilaterale, nessun accordo)",
    input_schema: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: {
            type: "object",
            required: ["iso", "name_it", "zone"],
            properties: {
              iso: { type: "string", description: "Codice ISO 3166-1 alpha-2" },
              name_it: { type: "string" },
              name_en: { type: "string" },
              zone: { enum: ["eu_eea", "bilateral_agreement", "no_agreement"] },
              notes: { type: "string" }
            }
          }
        },
        confidence: { enum: ["high", "medium", "low"] },
        extraction_notes: { type: "string" }
      }
    }
  },
  {
    name: "extract_bilateral_agreement",
    description: "Estrai i dettagli di un accordo bilaterale tra Italia e un paese",
    input_schema: {
      type: "object",
      required: ["country_iso", "active", "categories"],
      properties: {
        country_iso: { type: "string" },
        active: { type: "boolean" },
        effective_date: { type: "string", description: "ISO 8601 date o null" },
        expiry_date: { type: "string", description: "ISO 8601 date o null se senza scadenza" },
        categories: {
          type: "array",
          items: { type: "string" },
          description: "Es: ['B', 'A']"
        },
        temporal_condition: {
          enum: ["rilascio_ante_residenza", "entro_anni_residenza", "nessuna"],
          description: "Condizione temporale per la conversione"
        },
        years_from_residency: { type: "number", description: "Solo se temporal_condition = entro_anni_residenza" },
        requires_theory_exam: { type: "boolean" },
        requires_practical_exam: { type: "boolean" },
        legal_reference: { type: "string" },
        confidence: { enum: ["high", "medium", "low"] },
        extraction_notes: { type: "string" }
      }
    }
  },
  {
    name: "extract_required_documents",
    description: "Estrai la lista di documenti richiesti per una zona/paese specifico",
    input_schema: {
      type: "object",
      properties: {
        zone: { enum: ["eu_eea", "bilateral_agreement", "no_agreement"] },
        country_iso: { type: "string" },
        documents: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name_it: { type: "string" },
              mandatory: { type: "boolean" },
              conditional_note: { type: "string" }
            }
          }
        },
        confidence: { enum: ["high", "medium", "low"] }
      }
    }
  },
  {
    name: "report_uncertainty",
    description: "Segnala quando un'informazione non è chiara o manca nel documento",
    input_schema: {
      type: "object",
      required: ["topic", "reason"],
      properties: {
        topic: { type: "string" },
        reason: { type: "string" },
        raw_text: { type: "string", description: "Testo originale che ha causato incertezza" }
      }
    }
  }
]
```

---

## System prompt dell'agent

```
Sei un assistente specializzato nell'analisi di documenti normativi italiani relativi alla
conversione di patenti di guida estere.

Il tuo compito è ESTRARRE e STRUTTURARE informazioni dai documenti forniti.
NON devi interpretare la legge o fare classificazioni legali.

Regole operative:
1. Estrai SOLO le informazioni presenti nel documento — non aggiungere conoscenze proprie
2. Quando un'informazione è ambigua, usa report_uncertainty
3. Normalizza sempre: date in ISO 8601, codici paese in ISO 3166-1 alpha-2, categorie in array
4. Indica sempre il tuo livello di confidenza (high/medium/low)
5. Cita il testo originale quando rilevante nelle extraction_notes
6. Se trovi informazioni contrastanti, segnalale come uncertainty

Contesto: Le informazioni estratte verranno usate per aggiornare il dataset normativo di un
sistema di pre-classificazione per autoscuole italiane. Un operatore umano revisionerà il
tuo output prima di applicarlo.
```

---

## Flusso di esecuzione agent

```
1. INPUT: file sorgente (DOCX/PDF/HTML) + tipo di fonte + istruzioni specifiche

2. PREPROCESSING:
   - DOCX → mammoth.extractRawText() → testo markdown
   - PDF → pdf-parse → testo raw
   - HTML → cheerio → testo strutturato

3. CHUNKING:
   - Se documento > 50k token: splitta in sezioni logiche
   - Processa ogni chunk mantenendo contesto

4. LLM CALL (Claude claude-sonnet-4-6):
   - System prompt + testo estratto + tool definitions
   - L'agent usa i tool per strutturare l'output
   - Può fare multiple tool calls in sequenza

5. POST-PROCESSING:
   - Valida output con Zod schemas
   - Normalizza ulteriormente (ISO codes, dates)
   - Calcola diff rispetto dataset corrente

6. OUTPUT:
   {
     extracted_data: { countries: [...], agreements: [...], documents: [...] },
     uncertainties: [...],
     diff: { added: [...], modified: [...], removed: [...] },
     confidence_overall: "high" | "medium" | "low",
     review_required: boolean,
     agent_notes: string
   }
```

---

## Diff report formato

```json
{
  "diff": {
    "countries": {
      "added": [
        {"iso": "XY", "action": "add", "data": {...}, "reason": "Nuovo accordo firmato"}
      ],
      "modified": [
        {
          "iso": "MA",
          "action": "modify",
          "field": "temporal_condition",
          "old_value": "nessuna",
          "new_value": "rilascio_ante_residenza",
          "reason": "Aggiornamento accordo 2024"
        }
      ],
      "removed": []
    },
    "agreements": {
      "modified": [
        {
          "country_iso": "GB",
          "field": "expiry_date",
          "old_value": null,
          "new_value": "2024-12-31",
          "reason": "Accordo Brexit scaduto"
        }
      ]
    }
  },
  "summary": "2 modifiche rilevate: aggiornamento condizione temporale Marocco, scadenza accordo UK"
}
```

---

## Sicurezza e limiti dell'agent

### Safety controls

1. **Output validation**: Zod schema su tutto l'output → rifiuta output malformato
2. **Human in the loop**: nessun aggiornamento automatico al dataset — sempre review operatore
3. **Auditabilità**: ogni run agent salvato in `fonti_normative` con raw output
4. **Confidenza**: output con confidence=low → flag "RICHIEDE VERIFICA MANUALE"
5. **Max tokens**: limite esplicito per evitare run fuori controllo
6. **Retry limit**: max 3 retry su errori API, poi fallback a "estrazione manuale richiesta"

### Cosa l'agent NON fa

- Non accede a internet autonomamente (le fonti sono passate dall'esterno)
- Non modifica il DB direttamente — produce solo JSON proposto
- Non classifica pratiche — solo estrae da documenti normativi
- Non prende decisioni legali

---

## Dashboard operatore per AI agent

**Sezione `/dataset` della dashboard:**

```
[Upload nuovo documento normativo]
  └─> Seleziona file (DOCX/PDF/HTML)
  └─> Tipo fonte: [Portale Automobilista] [Circolare MIT] [GU] [Altro]
  └─> [Lancia estrazione AI]

[Lista estrazioni in corso/completate]
  ├─ 2024-01-15 | Portale Automobilista | ✅ Completata | 2 modifiche rilevate
  │     └─> [Visualizza diff] [Approva] [Rifiuta]
  └─ 2024-03-01 | Circolare MIT | ⏳ In corso...

[Diff viewer]
  Paese: Marocco
  Campo: condizione_temporale
  Vecchio: nessuna
  Nuovo: rilascio_ante_residenza
  Confidence: medium
  Note agent: "Il testo alla pagina 3 specifica che la patente deve essere..."
  [Approva questa modifica] [Rifiuta]
```

---

## API keys necessarie

Vedi `docs/API_KEYS_NEEDED.md` per la lista completa delle API richieste.

In sintesi: l'agent richiede **Anthropic API key** (Claude claude-sonnet-4-6).
