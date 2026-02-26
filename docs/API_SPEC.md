# API_SPEC.md — ConvertoPatenti

## Convenzioni

- Base URL: `/api`
- Auth: Bearer token (JWT session Auth.js) su tutti gli endpoint `/api/` tranne webhook e health
- Content-Type: `application/json`
- Errori: `{ error: string, code?: string }`
- Paginazione: `{ data: T[], total: number, page: number, limit: number }`

---

## Autenticazione

### POST `/api/auth/signin`
Login operatore autoscuola.

Request:
```json
{ "email": "operatore@autoscuola.it", "password": "..." }
```
Response: Cookie di sessione Auth.js (HttpOnly)

### POST `/api/auth/signout`
Logout.

### GET `/api/auth/session`
Sessione corrente.

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "...",
    "nome": "...",
    "cognome": "...",
    "ruolo": "operatore",
    "autoscuola_id": "uuid",
    "autoscuola_nome": "..."
  }
}
```

---

## Pratiche

### GET `/api/cases`
Lista pratiche dell'autoscuola autenticata.

Query params:
- `stato`: attesa_candidato | intake_in_corso | valutazione | completata | archiviata
- `classificazione`: LIKELY_CONVERTIBLE | NOT_CONVERTIBLE_EXAMS | NEEDS_REVIEW
- `paese`: ISO country code
- `q`: ricerca testo (nome candidato)
- `page`: default 1
- `limit`: default 20, max 100
- `sort`: created_at | updated_at | candidato_cognome
- `order`: asc | desc

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "stato": "completata",
      "classificazione": "LIKELY_CONVERTIBLE",
      "candidato_nome": "Ahmed",
      "candidato_cognome": "Benali",
      "paese_rilascio": "MA",
      "categoria_patente": "B",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T12:00:00Z",
      "telegram_link": "https://t.me/ConvertoPatentiBot?start=..."
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### POST `/api/cases`
Crea nuova pratica e genera link Telegram.

Request:
```json
{
  "note_iniziali": "Cliente arrivato in agenzia"
}
```

Response:
```json
{
  "id": "uuid",
  "telegram_token": "eyJ...",
  "telegram_link": "https://t.me/ConvertoPatentiBot?start=eyJ...",
  "stato": "attesa_candidato",
  "created_at": "..."
}
```

### GET `/api/cases/:id`
Dettaglio pratica.

Response:
```json
{
  "id": "uuid",
  "stato": "completata",
  "classificazione": "LIKELY_CONVERTIBLE",
  "classificazione_reasons": [
    "Paese Marocco: accordo bilaterale attivo",
    "Patente rilasciata il 15/03/2018, prima della residenza italiana (10/01/2020)"
  ],
  "documenti_richiesti": [
    { "doc_id": "PATENTE_ORIGINALE", "nome": "Patente originale", "obbligatorio": true },
    { "doc_id": "TRADUZIONE_ASSEVERATA", "nome": "Traduzione asseverata", "obbligatorio": true }
  ],
  "info_mancanti": [],
  "candidato": {
    "nome": "Ahmed",
    "cognome": "Benali",
    "nascita": "1985-06-20",
    "nazionalita": "MA",
    "lingua": "ar"
  },
  "patente": {
    "paese_rilascio": "MA",
    "categoria": "B",
    "data_rilascio": "2018-03-15",
    "data_scadenza": "2028-03-15",
    "valida": true
  },
  "residenza": {
    "data_prima_residenza": "2020-01-10",
    "tipo_soggiorno": "permesso_soggiorno",
    "scadenza_permesso": "2025-06-01"
  },
  "documenti_caricati": [
    {
      "id": "uuid",
      "tipo": "foto_patente",
      "nome_originale": "patente.jpg",
      "url": "https://blob.vercel.../signed-url",
      "caricato_da": "candidato_telegram",
      "created_at": "..."
    }
  ],
  "note": [
    { "id": "uuid", "testo": "...", "operatore": "Mario Rossi", "created_at": "..." }
  ],
  "telegram_link": "https://t.me/...",
  "classificazione_versione": "2024-01-15",
  "classificazione_at": "..."
}
```

### PATCH `/api/cases/:id`
Aggiorna campi pratica (operatore).

Request (campi opzionali):
```json
{
  "stato": "completata",
  "note_operatore": "..."
}
```

### DELETE `/api/cases/:id`
Archivia pratica (soft delete).

### POST `/api/cases/:id/evaluate`
Ri-esegue il rules engine sul caso (utile dopo aggiornamento manuale dati).

Response: output rules engine completo.

### POST `/api/cases/:id/notes`
Aggiunge nota operatore.

Request:
```json
{ "testo": "Il candidato ha portato tutti i documenti originali" }
```

### GET `/api/cases/:id/documents`
Lista documenti caricati per la pratica.

### POST `/api/cases/:id/documents`
Upload documento operatore.

Request: `multipart/form-data`
- `file`: il file
- `tipo`: tipo documento (foto_patente | permesso_soggiorno | passaporto | altro)

### GET `/api/cases/:id/export-pdf`
Genera e restituisce PDF scheda pratica.

Response: `application/pdf`

---

## Telegram webhook

### POST `/api/telegram/webhook`
Riceve aggiornamenti Telegram.

Headers:
- `X-Telegram-Bot-Api-Secret-Token`: token di verifica webhook

Request: corpo Telegram update (gestito da Grammy internamente)

Response: `200 OK` sempre (Telegram riprova su errori)

---

## Dataset normativo (admin)

### GET `/api/dataset/countries`
Lista paesi con status normativo.

### GET `/api/dataset/agreements`
Lista accordi bilaterali.

### GET `/api/dataset/sources`
Lista fonti normative importate.

### POST `/api/agent/extract`
Lancia AI agent su documento sorgente.

Request: `multipart/form-data`
- `file`: documento (DOCX/PDF/HTML)
- `source_type`: portale_automobilista | circolare_mit | gazzetta_ufficiale | altro
- `source_url`: URL originale (opzionale)

Response:
```json
{
  "extraction_id": "uuid",
  "status": "processing",
  "estimated_seconds": 30
}
```

### GET `/api/agent/extractions/:id`
Stato e risultato di un'estrazione AI.

Response:
```json
{
  "id": "uuid",
  "status": "completed",
  "result": {
    "extracted_data": { ... },
    "diff": { ... },
    "confidence_overall": "medium",
    "review_required": true,
    "agent_notes": "..."
  }
}
```

### POST `/api/agent/extractions/:id/apply`
Approva e applica un'estrazione al dataset.

### DELETE `/api/agent/extractions/:id`
Rifiuta un'estrazione.

---

## Health check

### GET `/api/health`
Status del sistema.

Response:
```json
{
  "status": "ok",
  "db": "ok",
  "version": "1.0.0",
  "dataset_version": "2024-01-15"
}
```

---

## Codici errore

| Code | HTTP | Significato |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Non autenticato |
| `FORBIDDEN` | 403 | Non autorizzato (altro tenant) |
| `NOT_FOUND` | 404 | Risorsa non trovata |
| `VALIDATION_ERROR` | 422 | Input non valido |
| `RATE_LIMITED` | 429 | Troppi richieste |
| `INTERNAL_ERROR` | 500 | Errore interno |
| `SERVICE_UNAVAILABLE` | 503 | DB o servizio esterno non disponibile |
