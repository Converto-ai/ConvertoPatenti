# API_KEYS_NEEDED.md — ConvertoPatenti

## Chiavi API necessarie

Questo file elenca tutte le API esterne necessarie al funzionamento del sistema,
perché servono e quale variabile d'ambiente usare.

---

## 1. Anthropic API (Claude) — OBBLIGATORIA per AI Agent

**Perché**: Il modulo AI Agent (Fase 8) usa Claude claude-sonnet-4-6 per estrarre e strutturare
informazioni da documenti normativi (DOCX, PDF, HTML).
Usato anche opzionalmente per tradurre le motivazioni del rules engine nella lingua del candidato.

**Modello**: `claude-sonnet-4-6` (più capace, ragionamento su testi normativi complessi)

**Uso stimato**: Basso in MVP — solo quando un operatore lancia un'estrazione da documento.
Circa 10-50k token per estrazione.

**Variable d'ambiente**:
```
ANTHROPIC_API_KEY=sk-ant-...
```

**Come ottenere**: https://console.anthropic.com/ → API Keys

**Costo stimato**: ~$0.01-0.10 per estrazione documento (claude-sonnet-4-6: $3/$15 per MTok in/out)

---

## 2. Telegram Bot Token — OBBLIGATORIA per bot candidati

**Perché**: Il bot Telegram è il canale principale di intake per il candidato.

**Come ottenere**:
1. Apri Telegram, cerca @BotFather
2. `/newbot` → scegli nome "ConvertoPatenti" → username "ConvertoPatentiBot"
3. Copia il token fornito

**Variable d'ambiente**:
```
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
```

**Costo**: Gratuito (Telegram API non ha costo)

---

## 3. Neon DB — OBBLIGATORIA (database)

**Perché**: Database PostgreSQL serverless principale.

**Come ottenere**: https://neon.tech → crea progetto → copia connection string

**Variable d'ambiente**:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Costo**: Free tier per MVP (3GB storage, 10 branches)

---

## 4. Vercel Blob — OBBLIGATORIA per storage file

**Perché**: Storage per file caricati (foto patenti, permessi soggiorno, PDF generati).
Signed URL per accesso sicuro temporaneo.

**Come ottenere**: Dashboard Vercel → progetto → Storage → Blob → Create Store

**Variable d'ambiente**:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

**Costo**: $0.023/GB storage + $0.04/GB transfer (molto economico per MVP)

---

## 5. Secrets interni — OBBLIGATORIE (generare localmente)

Questi non sono API esterne ma secrets che devi generare:

```bash
# NEXTAUTH_SECRET (32+ chars random)
openssl rand -base64 32

# TELEGRAM_WEBHOOK_SECRET (32+ chars random, solo chars [A-Za-z0-9_-])
openssl rand -hex 32

# TELEGRAM_LINK_SECRET (32+ chars random)
openssl rand -base64 32
```

**Variables d'ambiente**:
```
NEXTAUTH_SECRET=...
TELEGRAM_WEBHOOK_SECRET=...
TELEGRAM_LINK_SECRET=...
NEXTAUTH_URL=https://convertopatenti.com  # o http://localhost:3000 in dev
```

---

## Cosa NON serve (scelte deliberate)

- **OpenAI Whisper**: Non necessario — il bot Telegram riceve testo + foto, non audio trascrivibile nel flusso principale. Se in futuro si vuole la trascrizione vocale: aggiungere Whisper API.
- **Servizi DOCX/PDF parsing cloud** (es. Adobe PDF Extract API, Textract): Non necessari — usiamo librerie JS locali (mammoth, pdf-parse) + Claude per la comprensione. Risparmia costi e complessità.
- **Stripe**: Non in MVP — billing manuale o da aggiungere nella Fase 10+.
- **SendGrid/Resend**: Non in MVP — notifiche email opzionali (da aggiungere post-MVP).
- **Google Cloud Vision**: Non necessario — le foto dei documenti non vengono OCR-ate automaticamente nell'MVP (l'operatore le verifica manualmente).

---

## Checklist setup ambiente sviluppo

```bash
# 1. Crea file .env.local
cp .env.example .env.local

# 2. Riempi:
# - DATABASE_URL (da Neon)
# - NEXTAUTH_SECRET (genera con openssl)
# - NEXTAUTH_URL=http://localhost:3000
# - TELEGRAM_BOT_TOKEN (da @BotFather)
# - TELEGRAM_WEBHOOK_SECRET (genera)
# - TELEGRAM_LINK_SECRET (genera)
# - ANTHROPIC_API_KEY (da console.anthropic.com) [solo per AI Agent]
# - BLOB_READ_WRITE_TOKEN (da Vercel Blob) [solo per upload file]
```

**NOTA**: Per sviluppo locale senza Telegram webhook (bot non raggiungibile dall'esterno),
usare `ngrok` per esporre localhost:
```bash
ngrok http 3000
# poi aggiorna webhook con URL ngrok
```

---

## Stato richiesta chiavi

| API | Necessaria per | Urgenza | Status |
|-----|----------------|---------|--------|
| Neon DB | Tutto (FASE 2) | Critica | ⬜ DA FORNIRE |
| Telegram Bot Token | FASE 5 | Alta | ⬜ DA FORNIRE |
| Anthropic API Key | FASE 8 | Media | ⬜ DA FORNIRE |
| Vercel Blob | FASE 5-6 | Media | ⬜ DA FORNIRE |
| Secrets interni | FASE 2 | Critica | ⬜ GENERARE |

**Prossimi passi**: Fornisci le chiavi per Neon DB e i secrets interni per procedere con la FASE 2.
