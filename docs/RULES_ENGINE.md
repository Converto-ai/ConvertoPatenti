# RULES_ENGINE.md — ConvertoPatenti

## Principio fondamentale

**Il rules engine è deterministico, testato e spiegabile.**
LLM/AI non partecipano alla classificazione legale.
Dato lo stesso input, produce sempre lo stesso output.

---

## Riferimenti normativi

- **Art. 135 C.d.S.** — Conversione patenti UE/SEE: riconoscimento diretto
- **Art. 136-bis C.d.S.** — Conversione patenti extra-UE: accordi bilaterali e condizioni
- **D.M. 17 maggio 1995** — Modalità conversione
- **Circolari MIT** — Aggiornamenti periodici su accordi e procedure
- **Accordi bilaterali specifici** — Vari strumenti internazionali (vedi dataset)

---

## Input del rules engine

```typescript
interface RulesEngineInput {
  // Paese
  country_of_issue: string;          // ISO 3166-1 alpha-2 (es. "MA", "DE", "BR")

  // Dati patente
  license_category: string;          // "B", "A", "C", ecc.
  license_issue_date: Date | null;
  license_expiry_date: Date | null;
  license_valid: boolean | null;     // null = non noto

  // Dati residenza
  italy_residency_date: Date | null; // data prima iscrizione anagrafe

  // Permesso soggiorno (extra-UE)
  permit_type: 'cittadino_eu' | 'permesso_soggiorno' | 'carta_soggiorno' | null;
  permit_expiry_date: Date | null;

  // Data valutazione (default: oggi)
  evaluation_date?: Date;
}
```

## Output del rules engine

```typescript
interface RulesEngineOutput {
  classification: 'LIKELY_CONVERTIBLE' | 'NOT_CONVERTIBLE_EXAMS' | 'NEEDS_REVIEW';
  reasons: string[];                 // motivazioni leggibili (in italiano)
  required_documents: RequiredDocument[];
  missing_information: string[];     // info mancanti che potrebbero cambiare la classificazione
  dataset_version: string;           // versione dataset usata
  evaluated_at: Date;
}

interface RequiredDocument {
  doc_id: string;                    // codice tipologia_documento
  nome: string;
  obbligatorio: boolean;
  note?: string;
}
```

---

## Albero decisionale

```
START
  │
  ├─► [MISSING_CRITICAL] Se mancano: country_of_issue, license_category
  │     → classification: NEEDS_REVIEW
  │     → missing_information: ["paese rilascio patente", "categoria patente"]
  │
  ├─► [CHECK_EU_EEA] Il paese è in UE/SEE?
  │     SÌ ──────────────────────────────────────────────────────────────────┐
  │     │                                                                    │
  │     │  ├─► Patente valida? (non scaduta + valid_flag)                   │
  │     │  │   NO → classification: NEEDS_REVIEW                            │
  │     │  │         reasons: ["Patente scaduta — verifica rinnovo"]        │
  │     │  │         (patente UE scaduta può essere convertita se          │
  │     │  │          scaduta da meno di 3 anni, regola MIT)               │
  │     │  │                                                                │
  │     │  └─► Patente valida o scaduta da meno 3 anni                    │
  │     │        → classification: LIKELY_CONVERTIBLE                       │
  │     │          reasons: ["Paese UE/SEE: conversione diretta art.135"]  │
  │     │          required_documents: [config zona=eu_eea]                │
  │     └──────────────────────────────────────────────────────────────────┘
  │
  └─► [CHECK_BILATERAL] Il paese ha accordo bilaterale attivo?
        SÌ ──────────────────────────────────────────────────────────────────┐
        │                                                                    │
        │  ├─► Accordo in vigore alla data valutazione?                     │
        │  │   (data_inizio <= today && (data_fine IS NULL || data_fine >= today))
        │  │   NO → vai a NO_AGREEMENT                                      │
        │  │                                                                 │
        │  ├─► Categoria patente coperta dall'accordo?                      │
        │  │   NO → classification: NOT_CONVERTIBLE_EXAMS                   │
        │  │         reasons: ["Categoria X non coperta dall'accordo con Y"] │
        │  │                                                                 │
        │  ├─► CHECK_TEMPORAL_CONDITION                                     │
        │  │   Condizione: 'rilascio_ante_residenza'                        │
        │  │     → license_issue_date < italy_residency_date?               │
        │  │       NO → LIKELY_CONVERTIBLE con warning o NEEDS_REVIEW       │
        │  │       SÌ → OK                                                  │
        │  │   Condizione: 'entro_anni_residenza'                           │
        │  │     → license_issue_date <= italy_residency_date + N anni?     │
        │  │       NO → NOT_CONVERTIBLE_EXAMS                               │
        │  │       SÌ → OK                                                  │
        │  │   Condizione: 'nessuna' → OK                                   │
        │  │                                                                 │
        │  ├─► Patente valida?                                              │
        │  │   NO → NEEDS_REVIEW (patente scaduta extra-UE è problematica)  │
        │  │                                                                 │
        │  ├─► Permesso soggiorno valido? (se extra-UE)                    │
        │  │   permit_expiry < today → NEEDS_REVIEW                        │
        │  │                                                                 │
        │  └─► Tutte le condizioni OK                                       │
        │        → classification: LIKELY_CONVERTIBLE                       │
        │          reasons: ["Accordo bilaterale attivo con X", ...]        │
        │          required_documents: [config zona=bilateral + paese]      │
        └──────────────────────────────────────────────────────────────────┘

        NO AGREEMENT
          → classification: NOT_CONVERTIBLE_EXAMS
            reasons: ["Nessun accordo bilaterale tra Italia e X",
                      "Necessario esame teorico e pratico art.136-bis"]
            required_documents: [config zona=no_agreement]
```

---

## Casi speciali

### Svizzera
- Non UE, ma accordo speciale. Trattata come bilateral_agreement.

### San Marino / Vaticano
- De facto equiparati a UE per praticità, ma verificare aggiornamenti.

### UK post-Brexit
- Dal 01/01/2021 non più UE. Ha un accordo bilaterale specifico per i residenti con patente UK ante-Brexit e condizioni temporali precise. Dataset deve riflettere la data-fine dell'accordo transitorio.

### Patente scaduta UE
- Può essere convertita se scaduta da meno di 3 anni → output: LIKELY_CONVERTIBLE con nota "patente scaduta — potrebbe richiedere visita medica".

### Categorie speciali
- Categorie C, D (camion, bus) hanno requisiti aggiuntivi (certificato medico CML, etc.)
- Il rules engine segnala → required_documents include i certificati medici

### Minori (< 18 anni)
- Non gestiti dall'MVP (flag NEEDS_REVIEW se data_nascita < 18 anni)

---

## Classi di classificazione

| Classificazione | Significato | Prossimo passo operatore |
|----------------|-------------|--------------------------|
| `LIKELY_CONVERTIBLE` | Il caso sembra convertibile in base a regole note | Raccogliere documenti richiesti, procedere con TT2112 |
| `NOT_CONVERTIBLE_EXAMS` | Non convertibile: deve sostenere esami | Informare candidato, iscriverlo a teoria/pratica |
| `NEEDS_REVIEW` | Dati insufficienti o caso ambiguo | Operatore verifica manualmente, richiede info aggiuntive |

**Nota**: `LIKELY_CONVERTIBLE` non è una garanzia legale — è una pre-classificazione basata su dati raccolti. L'operatore è responsabile della verifica finale.

---

## Versioning e testabilità

Il rules engine è una funzione pura:
```
evaluate(input: RulesEngineInput, dataset: NormativeDataset) → RulesEngineOutput
```

Il `dataset` viene caricato dal DB (o JSON in test).
Ogni test case include l'input, il dataset version e l'output atteso.

### Test cases obbligatori (minimo)

| ID | Scenario | Input key | Expected output |
|----|----------|-----------|-----------------|
| T01 | Candidato tedesco, pat. valida, cat. B | country=DE, eu_eea=true | LIKELY_CONVERTIBLE |
| T02 | Candidato marocchino, accordo attivo, pat. rilasciata ante-residenza | country=MA, bilateral=true | LIKELY_CONVERTIBLE |
| T03 | Candidato brasiliano, nessun accordo | country=BR, no_agreement | NOT_CONVERTIBLE_EXAMS |
| T04 | Paese mancante | country=null | NEEDS_REVIEW |
| T05 | Accordo bilaterale scaduto | country=XX, accordo.data_fine < oggi | NOT_CONVERTIBLE_EXAMS |
| T06 | Cat. C non coperta da accordo | country=MA, category=C, accordo.categorie=['B'] | NOT_CONVERTIBLE_EXAMS |
| T07 | Patente scaduta UE < 3 anni | country=FR, scaduta=18mesi fa | LIKELY_CONVERTIBLE + nota |
| T08 | Patente scaduta extra-UE | country=MA, scaduta | NEEDS_REVIEW |
| T09 | Permesso soggiorno scaduto | permit_expiry < oggi | NEEDS_REVIEW |
| T10 | UK post-Brexit (accordo transitorio scaduto) | country=GB, data oggi > accordo.data_fine | NOT_CONVERTIBLE_EXAMS |

---

## Aggiornamento rules engine

Il rules engine NON contiene logica hard-coded sui paesi specifici.
Tutta la logica country-specific è nel dataset (`paesi`, `accordi_bilaterali`, `documenti_richiesti_config`).

Per aggiornare quando cambia un accordo:
1. Aggiornare il dataset (via AI agent o manualmente)
2. Creare nuova versione dataset
3. I test esistenti passano ancora (scenari invariati)
4. Aggiungere test per nuovi scenari
