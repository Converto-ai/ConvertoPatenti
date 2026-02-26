# SECURITY.md — ConvertoPatenti

## Threat model

| Minaccia | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Accesso cross-tenant ai dati | Media | Critico | autoscuola_id in ogni query, validazione session |
| Token Telegram forged | Bassa | Alto | JWT firmato con secret, verifica firma + exp |
| File upload malicious | Media | Medio | MIME type check, size limit, storage isolato |
| SQL injection | Bassa | Critico | ORM parametrizzato (Drizzle), nessuna query raw |
| API key leaked | Media | Critico | Env vars, mai in codice, .gitignore, secret rotation |
| Brute force auth | Media | Alto | Rate limiting, bcrypt password hash |
| IDOR su pratiche | Media | Alto | Verifica autoscuola_id su ogni operazione |

---

## Autenticazione autoscuola

- Password hash: **bcrypt** (rounds: 12)
- Session: Auth.js JWT (HttpOnly cookie, Secure, SameSite=Strict)
- Session duration: 8h (lavorativa), refresh automatico
- Nessun token in URL o localStorage

---

## Token Telegram (link candidato)

```
Struttura: JWT firmato con HMAC-SHA256
Payload: { case_id: string, autoscuola_id: string, iat: number, exp: number }
Scadenza: 30 giorni (configurabile)
Secret: TELEGRAM_LINK_SECRET (env var, min 32 chars random)
```

Verifica in bot:
1. Verifica firma JWT
2. Verifica exp non scaduto
3. Carica pratica da DB e verifica autoscuola_id corrisponde
4. Verifica stato pratica ≠ 'completata'

---

## Isolamento dati multi-tenant

Ogni API route che accede a dati applica questo pattern:

```typescript
// Pattern sicuro obbligatorio
const pratica = await db.query.pratiche.findFirst({
  where: and(
    eq(pratiche.id, input.praticaId),
    eq(pratiche.autoscuolaId, session.autoscuolaId)  // SEMPRE
  )
})

if (!pratica) throw new NotFoundError() // Non esporre "non autorizzato" vs "non trovato"
```

Middleware di sessione aggiunge `session.autoscuolaId` a tutte le richieste autenticate.

---

## File/documenti

- Upload accettati: jpeg, jpg, png, pdf, heic
- Size limit: 10MB per file, 50MB per pratica
- MIME type verificato lato server (non solo estensione)
- Nomi file sanitizzati (no path traversal)
- Storage: Vercel Blob con URL firmati (TTL 1h)
- Nessun file mai esposto via URL pubblico permanente
- Pulizia periodica file orfani (cron job)

---

## API security

- **Rate limiting**: 100 req/min per IP su /api/ (Next.js middleware)
- **Webhook Telegram**: verifica X-Telegram-Bot-Api-Secret-Token header
- **CORS**: solo origini trusted (no wildcard in prod)
- **Input validation**: Zod su tutti gli endpoint
- **Error responses**: messaggi generici (niente stack trace in prod)

---

## Secrets management

Tutte le chiavi sono env vars:
```
DATABASE_URL          # Neon connection string (con SSL)
NEXTAUTH_SECRET       # Auth.js session secret
TELEGRAM_BOT_TOKEN    # Bot token @BotFather
TELEGRAM_WEBHOOK_SECRET # Header verification
TELEGRAM_LINK_SECRET  # JWT signing per link candidati
ANTHROPIC_API_KEY     # Claude API
BLOB_READ_WRITE_TOKEN # Vercel Blob
```

Regole:
- Mai committare `.env.local` (`.gitignore`)
- `.env.example` con nomi ma nessun valore reale
- Rotation automatica in caso di sospetto leak
- In produzione: Vercel Environment Variables (cifrate)

---

## GDPR

**Base legale**: legittimo interesse (artt. 135-136 CdS impongono raccolta documenti identità per conversione)

**Dati raccolti** (per candidato):
- Nome, cognome, data nascita → necessari per pratica
- Nazionalità, paese patente → necessari per classificazione
- Foto patente, permesso soggiorno → necessari per verifica documenti
- Chat ID Telegram → necessario per flusso bot (non persistito a lungo termine)

**Retention**:
- Dati pratiche: max 5 anni (obblighi legali autoscuola per conservazione pratiche)
- Sessioni Telegram: eliminate dopo completamento + 30gg
- File documenti: max 5 anni, poi eliminazione automatica

**Diritti interessati**:
- Accesso/rettifica/cancellazione: gestiti dall'autoscuola (data controller)
- Il SaaS è data processor — contratto DPA con ogni autoscuola

**Privacy notice**: mostrata nel bot Telegram prima della raccolta dati (STEP_INTRO)

---

## Logging

Log di sicurezza (non PII):
- Login attempts (successo/fallimento) con IP
- Accessi a pratiche (operatore_id, pratica_id, timestamp)
- Upload file (tipo, dimensione, esito)
- Webhook Telegram (chat_id anonimizzato, esito)

Log NON salvati:
- Contenuto messaggi Telegram
- Dati anagrafici del candidato nei log

---

## Aggiornamenti dipendenze

- `npm audit` nella CI
- Aggiornamenti patch automatici (Dependabot o manuale mensile)
- Major updates: review manuale
