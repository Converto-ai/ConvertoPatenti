# DATABASE_SCHEMA.md — ConvertoPatenti

## Overview

PostgreSQL su Neon (serverless). ORM: Drizzle.
Schema multi-tenant: `autoscuola_id` presente in tutte le tabelle dati.

---

## Tabelle

### `autoscuole`
Clienti del SaaS (le autoscuole).

```sql
CREATE TABLE autoscuole (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  codice_fiscale TEXT UNIQUE,
  indirizzo     TEXT,
  citta         TEXT,
  email         TEXT NOT NULL UNIQUE,
  telefono      TEXT,
  piano         TEXT NOT NULL DEFAULT 'trial',  -- trial | base | pro
  piano_scadenza TIMESTAMPTZ,
  attiva        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `operatori`
Utenti delle autoscuole (possono esserci più operatori per autoscuola).

```sql
CREATE TABLE operatori (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autoscuola_id   UUID NOT NULL REFERENCES autoscuole(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  cognome         TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  ruolo           TEXT NOT NULL DEFAULT 'operatore',  -- admin | operatore
  attivo          BOOLEAN NOT NULL DEFAULT true,
  ultimo_accesso  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_operatori_autoscuola ON operatori(autoscuola_id);
CREATE INDEX idx_operatori_email ON operatori(email);
```

### `pratiche`
La pratica principale — una per candidato/conversione.

```sql
CREATE TABLE pratiche (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autoscuola_id   UUID NOT NULL REFERENCES autoscuole(id) ON DELETE CASCADE,
  operatore_id    UUID REFERENCES operatori(id),

  -- Link Telegram
  telegram_token  TEXT NOT NULL UNIQUE,  -- token firmato per link candidato
  telegram_chat_id TEXT,                 -- chat_id Telegram del candidato (dopo primo contatto)

  -- Stato pratica
  stato           TEXT NOT NULL DEFAULT 'attesa_candidato',
  -- attesa_candidato | intake_in_corso | valutazione | completata | archiviata

  -- Dati candidato (raccolti dal bot o inseriti manualmente)
  candidato_nome        TEXT,
  candidato_cognome     TEXT,
  candidato_nascita     DATE,
  candidato_nazionalita TEXT,  -- ISO 3166-1 alpha-2
  candidato_lingua      TEXT DEFAULT 'it',  -- lingua scelta nel bot

  -- Dati patente
  paese_rilascio        TEXT,   -- ISO 3166-1 alpha-2
  categoria_patente     TEXT,   -- A | A1 | A2 | B | B1 | BE | C | C1 | D | ecc.
  data_rilascio_patente DATE,
  data_scadenza_patente DATE,
  patente_valida        BOOLEAN,
  numero_patente        TEXT,

  -- Dati residenza/soggiorno (rilevanti per regole)
  data_prima_residenza  DATE,   -- quando è arrivato in Italia
  tipo_soggiorno        TEXT,   -- cittadino_eu | permesso_soggiorno | carta_soggiorno
  scadenza_permesso     DATE,

  -- Risultato rules engine
  classificazione       TEXT,
  -- LIKELY_CONVERTIBLE | NOT_CONVERTIBLE_EXAMS | NEEDS_REVIEW
  classificazione_reasons JSONB DEFAULT '[]',  -- array di stringhe motivazioni
  documenti_richiesti   JSONB DEFAULT '[]',    -- array di {doc_id, nome, obbligatorio, note}
  info_mancanti         JSONB DEFAULT '[]',    -- array di stringhe info mancanti
  classificazione_at    TIMESTAMPTZ,
  classificazione_versione TEXT,  -- versione dataset usata per classificazione

  -- Metadati
  note_operatore        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pratiche_autoscuola ON pratiche(autoscuola_id);
CREATE INDEX idx_pratiche_stato ON pratiche(stato);
CREATE INDEX idx_pratiche_paese ON pratiche(paese_rilascio);
CREATE INDEX idx_pratiche_token ON pratiche(telegram_token);
```

### `telegram_sessioni`
Stato conversazione Telegram (grammy conversations). Serializzato in DB.

```sql
CREATE TABLE telegram_sessioni (
  chat_id         TEXT PRIMARY KEY,
  pratica_id      UUID REFERENCES pratiche(id) ON DELETE CASCADE,
  stato_conv      TEXT NOT NULL DEFAULT 'start',
  dati_raccolti   JSONB NOT NULL DEFAULT '{}',  -- dati parziali durante intake
  step_corrente   INTEGER NOT NULL DEFAULT 0,
  lingua          TEXT NOT NULL DEFAULT 'it',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `documenti_pratica`
File caricati per una pratica (patenti fotografate, permessi, ecc.).

```sql
CREATE TABLE documenti_pratica (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pratica_id      UUID NOT NULL REFERENCES pratiche(id) ON DELETE CASCADE,
  autoscuola_id   UUID NOT NULL REFERENCES autoscuole(id) ON DELETE CASCADE,

  nome_originale  TEXT NOT NULL,
  tipo_documento  TEXT NOT NULL,  -- foto_patente | permesso_soggiorno | passaporto | altro
  storage_key     TEXT NOT NULL,  -- chiave su Vercel Blob / R2
  mime_type       TEXT NOT NULL,
  dimensione_bytes INTEGER,

  caricato_da     TEXT NOT NULL,  -- 'candidato_telegram' | 'operatore_dashboard'
  operatore_id    UUID REFERENCES operatori(id),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_pratica ON documenti_pratica(pratica_id);
```

### `note_pratica`
Log note degli operatori su una pratica.

```sql
CREATE TABLE note_pratica (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pratica_id      UUID NOT NULL REFERENCES pratiche(id) ON DELETE CASCADE,
  operatore_id    UUID NOT NULL REFERENCES operatori(id),
  testo           TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_note_pratica ON note_pratica(pratica_id);
```

---

## Tabelle dataset normativo

### `paesi`
Dati normativi per paese.

```sql
CREATE TABLE paesi (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codice_iso      TEXT NOT NULL UNIQUE,   -- ISO 3166-1 alpha-2 (es. 'MA', 'BR', 'DE')
  nome_it         TEXT NOT NULL,
  nome_en         TEXT NOT NULL,

  -- Classificazione normativa
  zona            TEXT NOT NULL,
  -- eu_eea | bilateral_agreement | no_agreement

  -- Flag UE/SEE (conversione diretta)
  is_eu_eea       BOOLEAN NOT NULL DEFAULT false,

  -- Per paesi con accordo bilaterale
  ha_accordo      BOOLEAN NOT NULL DEFAULT false,
  accordo_id      UUID REFERENCES accordi_bilaterali(id),

  -- Note generali
  note            TEXT,

  -- Versioning
  versione_dataset TEXT NOT NULL,
  fonte_id        UUID REFERENCES fonti_normative(id),

  attivo          BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paesi_iso ON paesi(codice_iso);
CREATE INDEX idx_paesi_zona ON paesi(zona);
```

### `accordi_bilaterali`
Accordi bilaterali Italia con paesi extra-UE.

```sql
CREATE TABLE accordi_bilaterali (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paese_iso       TEXT NOT NULL,          -- ISO 3166-1 alpha-2

  -- Validità accordo
  data_inizio     DATE,                   -- quando entra in vigore
  data_fine       DATE,                   -- null = in vigore senza scadenza
  in_vigore       BOOLEAN NOT NULL DEFAULT true,

  -- Categorie convertibili tramite accordo
  categorie       TEXT[] NOT NULL DEFAULT '{}',
  -- es: ['B', 'A'] — solo queste categorie sono convertibili

  -- Condizioni temporali
  -- "la patente deve essere stata rilasciata prima della residenza in Italia"
  -- oppure "entro X anni dalla residenza"
  condizione_temporale TEXT,
  -- 'rilascio_ante_residenza' | 'entro_anni_residenza' | 'nessuna'
  anni_dalla_residenza INTEGER,  -- usato se condizione = 'entro_anni_residenza'

  -- La conversione richiede esame teorico/pratico?
  richiede_esame_teoria   BOOLEAN NOT NULL DEFAULT false,
  richiede_esame_pratica  BOOLEAN NOT NULL DEFAULT false,

  -- Reciprocità (Italia riconosce E paese riconosce Italia)
  reciproco       BOOLEAN NOT NULL DEFAULT true,

  -- Note e riferimento normativo
  note            TEXT,
  riferimento_normativo TEXT,  -- es. "Accordo bilaterale GU n.123 del 01/01/2020"

  -- Versioning
  versione_dataset TEXT NOT NULL,
  fonte_id        UUID REFERENCES fonti_normative(id),

  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `tipologie_documento`
Catalogo documenti richiesti (configurabile per paese/caso).

```sql
CREATE TABLE tipologie_documento (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codice          TEXT NOT NULL UNIQUE,   -- es. 'PATENTE_ORIGINALE', 'TRADUZIONE_AIS'
  nome_it         TEXT NOT NULL,
  nome_en         TEXT NOT NULL,
  descrizione     TEXT,

  -- Template testo per checklist
  istruzioni_it   TEXT,
  istruzioni_en   TEXT,

  attivo          BOOLEAN NOT NULL DEFAULT true
);
```

### `documenti_richiesti_config`
Mappa paese/zona → documenti necessari.

```sql
CREATE TABLE documenti_richiesti_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Applicabilità
  zona            TEXT,           -- eu_eea | bilateral_agreement | no_agreement (null = tutti)
  paese_iso       TEXT,           -- ISO specifico (null = tutta la zona)
  categoria       TEXT,           -- categoria patente (null = tutte)

  -- Documento
  tipologia_id    UUID NOT NULL REFERENCES tipologie_documento(id),
  obbligatorio    BOOLEAN NOT NULL DEFAULT true,
  condizionale    TEXT,           -- descrizione condizione testuale (es. "se patente scaduta")
  ordine          INTEGER NOT NULL DEFAULT 0,

  -- Versioning
  versione_dataset TEXT NOT NULL,

  attivo          BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_doc_config_zona ON documenti_richiesti_config(zona);
CREATE INDEX idx_doc_config_paese ON documenti_richiesti_config(paese_iso);
```

### `fonti_normative`
Registro delle fonti originali (per audit e versioning).

```sql
CREATE TABLE fonti_normative (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome            TEXT NOT NULL,          -- es. "Portale Automobilista - Lista Paesi Accordi"
  tipo            TEXT NOT NULL,          -- url | docx | pdf | html
  url_originale   TEXT,
  storage_key     TEXT,                   -- se archiviato localmente

  -- Hashing per rilevare cambiamenti
  hash_contenuto  TEXT,                   -- SHA-256 del contenuto

  -- Versioning
  data_acquisizione TIMESTAMPTZ NOT NULL DEFAULT now(),
  versione        TEXT NOT NULL,          -- es. "2024-01-15"

  -- Output agent
  estratto_json   JSONB,                  -- output normalizzato dall'AI agent
  diff_json       JSONB,                  -- diff rispetto versione precedente
  stato_review    TEXT NOT NULL DEFAULT 'pending',
  -- pending | reviewed | applied | rejected

  note            TEXT,
  applicato_da    UUID REFERENCES operatori(id),
  applicato_at    TIMESTAMPTZ
);
```

---

## Schema relazionale (vista d'insieme)

```
autoscuole ──< operatori
autoscuole ──< pratiche ──< documenti_pratica
pratiche ──< note_pratica (operatori)
pratiche ──1 telegram_sessioni

paesi >── accordi_bilaterali
paesi >── fonti_normative

documenti_richiesti_config >── tipologie_documento
```

---

## Versioning dataset normativo

Il campo `versione_dataset` in `paesi`, `accordi_bilaterali` e `documenti_richiesti_config` segue il formato `YYYY-MM-DD`.

Quando viene aggiornato il dataset:
1. Nuovi record con nuova versione
2. Record vecchi rimangono (soft history)
3. La versione attiva è quella con data più recente
4. Le pratiche archiviano la versione usata per classificazione → auditabilità

---

## Note GDPR

- I dati del candidato (nome, cognome, nascita, documenti) sono in `pratiche` e `documenti_pratica`
- Accesso solo via autoscuola_id corrispondente
- Documenti file: solo URL firmati temporanei, mai esposti pubblicamente
- Cancellazione: `ON DELETE CASCADE` propaga correttamente
- Retention: definire periodo massimo (es. 5 anni per obblighi normativi autoscuola)
