# DATA_PIPELINE.md — ConvertoPatenti

## Overview

Il dataset normativo (paesi, accordi, documenti) non esiste in forma strutturata ufficiale.
Deve essere costruito, mantenuto e versionato manualmente + con supporto AI agent.

---

## Struttura dataset

```
data/
├── sources/                    # Fonti originali (archiviate, versionate in git)
│   ├── 2024-01-15_portale-automobilista-accordi.docx
│   ├── 2024-01-15_portale-automobilista-accordi.html
│   ├── 2024-03-01_circolare-mit-2024-03.pdf
│   └── ...
├── countries.json              # Dataset paesi normalizzato (working copy)
├── agreements.json             # Dataset accordi bilaterali (working copy)
├── documents-config.json       # Configurazione documenti richiesti
└── versions.json               # Registro versioni
```

---

## Formato `countries.json`

```json
{
  "version": "2024-01-15",
  "generated_at": "2024-01-15T10:00:00Z",
  "countries": [
    {
      "iso": "DE",
      "name_it": "Germania",
      "name_en": "Germany",
      "zone": "eu_eea",
      "is_eu_eea": true,
      "has_agreement": false,
      "notes": null,
      "source": "Portale Automobilista",
      "source_date": "2024-01-15",
      "active": true
    },
    {
      "iso": "MA",
      "name_it": "Marocco",
      "name_en": "Morocco",
      "zone": "bilateral_agreement",
      "is_eu_eea": false,
      "has_agreement": true,
      "agreement_id": "MA-2024",
      "notes": "Accordo storico, verificare aggiornamenti",
      "source": "Portale Automobilista",
      "source_date": "2024-01-15",
      "active": true
    },
    {
      "iso": "BR",
      "name_it": "Brasile",
      "name_en": "Brazil",
      "zone": "no_agreement",
      "is_eu_eea": false,
      "has_agreement": false,
      "notes": null,
      "source": "Portale Automobilista",
      "source_date": "2024-01-15",
      "active": true
    }
  ]
}
```

---

## Formato `agreements.json`

```json
{
  "version": "2024-01-15",
  "agreements": [
    {
      "id": "MA-2024",
      "country_iso": "MA",
      "active": true,
      "effective_date": "1996-01-01",
      "expiry_date": null,
      "categories": ["B"],
      "temporal_condition": "rilascio_ante_residenza",
      "years_from_residency": null,
      "requires_theory_exam": false,
      "requires_practical_exam": false,
      "reciprocal": true,
      "legal_reference": "Accordo bilaterale MAR-ITA",
      "source": "Portale Automobilista",
      "source_date": "2024-01-15",
      "notes": "Verificare condizioni aggiornate"
    }
  ]
}
```

---

## Formato `documents-config.json`

```json
{
  "version": "2024-01-15",
  "document_types": [
    {
      "code": "PATENTE_ORIGINALE",
      "name_it": "Patente di guida originale",
      "name_en": "Original driving licence",
      "instructions_it": "Portare la patente originale in corso di validità",
      "instructions_en": "Bring the original valid driving licence"
    },
    {
      "code": "TRADUZIONE_ASSEVERATA",
      "name_it": "Traduzione asseverata della patente",
      "name_en": "Certified translation of licence",
      "instructions_it": "Traduzione ufficiale da traduttore giurato o AIS",
      "instructions_en": "Official translation by sworn translator or AIS"
    }
  ],
  "requirements": [
    {
      "zone": "eu_eea",
      "country_iso": null,
      "category": null,
      "required_docs": [
        {"code": "PATENTE_ORIGINALE", "mandatory": true, "conditional": null, "order": 1},
        {"code": "DOCUMENTO_IDENTITA", "mandatory": true, "conditional": null, "order": 2},
        {"code": "CODICE_FISCALE", "mandatory": true, "conditional": null, "order": 3},
        {"code": "RESIDENZA", "mandatory": true, "conditional": null, "order": 4},
        {"code": "MARCA_BOLLO", "mandatory": true, "conditional": null, "order": 5},
        {"code": "FOTO_TESSERA", "mandatory": true, "conditional": null, "order": 6},
        {"code": "MODULO_TT2112", "mandatory": true, "conditional": null, "order": 7}
      ]
    },
    {
      "zone": "bilateral_agreement",
      "country_iso": null,
      "category": null,
      "required_docs": [
        {"code": "PATENTE_ORIGINALE", "mandatory": true, "conditional": null, "order": 1},
        {"code": "TRADUZIONE_ASSEVERATA", "mandatory": true, "conditional": null, "order": 2},
        {"code": "PASSAPORTO", "mandatory": true, "conditional": null, "order": 3},
        {"code": "PERMESSO_SOGGIORNO", "mandatory": true, "conditional": null, "order": 4},
        {"code": "RESIDENZA", "mandatory": true, "conditional": null, "order": 5},
        {"code": "MARCA_BOLLO", "mandatory": true, "conditional": null, "order": 6},
        {"code": "FOTO_TESSERA", "mandatory": true, "conditional": null, "order": 7},
        {"code": "MODULO_TT2112", "mandatory": true, "conditional": null, "order": 8},
        {"code": "CERT_AUTENTICITA", "mandatory": false, "conditional": "Richiesto da alcuni consolati", "order": 9}
      ]
    }
  ]
}
```

---

## Script pipeline

### `scripts/import-dataset.ts`

Importa i JSON in Neon DB creando nuova versione:

```bash
npm run db:seed              # Import completo (first run)
npm run db:update-dataset    # Aggiornamento versione (incrementale)
```

Logica:
1. Legge `data/countries.json`, `data/agreements.json`, `data/documents-config.json`
2. Verifica versione (non reimporta la stessa versione)
3. Upsert paesi + accordi + config documenti con nuova versione
4. Log in `fonti_normative` con hash del file

### `scripts/fetch-source.ts`

Scarica e archivia una fonte originale:

```bash
npm run fetch-source -- --url "https://..." --name "portale-accordi" --type html
```

Logica:
1. HTTP GET della pagina
2. Hash SHA-256 del contenuto
3. Confronta con ultimo hash in `fonti_normative`
4. Se diverso: salva in `data/sources/` con timestamp, crea record in DB
5. Lancia AI agent per estrazione (opzionale, flag `--extract`)

### `scripts/run-agent.ts`

Lancia l'AI agent su un file sorgente:

```bash
npm run agent:extract -- --source "data/sources/2024-01-15_portale-accordi.docx"
npm run agent:diff -- --old "2024-01-01_portale.docx" --new "2024-06-01_portale.docx"
```

---

## Versioning workflow

### Aggiornamento normale (trimestrale)

```
1. [Auto] fetch-source scarica le pagine Portale Automobilista
2. [Auto] Confronta hash → se cambiato, crea alert
3. [Manuale] Operatore admin lancia AI agent su nuova fonte
4. [AI Agent] Estrae JSON proposto + diff rispetto a versione precedente
5. [Manuale] Operatore admin review il diff in dashboard
6. [Manuale] Se approvato: applica al dataset (nuovo JSON + import DB)
7. [Auto] Script aggiorna versione_dataset, crea record in fonti_normative
```

### Aggiornamento urgente (nuovo accordo)

```
1. [Manuale] Operatore carica PDF/DOCX della GU o comunicazione MIT
2. [AI Agent] Estrae informazioni accordo → propone aggiornamento
3. [Manuale] Review + approvazione
4. [Manuale] Aggiorna countries.json + agreements.json manualmente o via diff AI
5. [Auto] Import in DB
6. [Manuale] Aggiunge test case per nuovo paese/accordo
7. [Auto] Test suite passa → deploy
```

---

## Auditabilità

Ogni pratica salva in `classificazione_versione` la versione dataset usata.

Questo garantisce:
- Ricostruzione del ragionamento anche mesi dopo
- Tracciabilità di "quale normativa era vigente al momento della classificazione"
- Difendibilità in caso di contestazione

---

## Sicurezza del dataset

- Il dataset normativo è pubblico (basato su fonti pubbliche) → nessun segreto
- I file sorgente originali (DOCX, PDF) sono archiviati in `data/sources/` nel repo
- Versioni precedenti mantenute in git history
- No PII nel dataset normativo
