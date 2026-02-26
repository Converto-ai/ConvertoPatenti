# ARCHITECTURE.md — ConvertoPatenti

## Principi guida

1. **Semplicità operativa**: MVP serio, non over-engineered
2. **Auditabilità**: ogni classificazione è tracciabile e motivata
3. **Separazione responsabilità**: AI agent legge/estrae, rules engine decide
4. **Multi-tenancy**: ogni autoscuola ha i propri dati isolati
5. **Sicurezza GDPR**: dati sensibili (documenti identità) con accesso controllato

---

## Stack tecnico — decisioni motivate

### Obbligatori (da specifiche)
| Tecnologia | Ruolo |
|-----------|-------|
| **Next.js 14 (App Router)** | Frontend + API routes + SSR dashboard |
| **TailwindCSS** | Styling utility-first |
| **Neon DB** (PostgreSQL serverless) | Database principale |

### Decisi da me (con motivazioni)

| Tecnologia | Ruolo | Motivazione |
|-----------|-------|-------------|
| **Drizzle ORM** | ORM type-safe | Leggero, zero-overhead, ottimo con Neon/edge, type inference nativa, migrations semplici. Alternativa scartata: Prisma (più pesante, client non edge-compatible nativamente) |
| **Auth.js v5 (NextAuth)** | Autenticazione autoscuola | Standard de-facto per Next.js, supporta credentials + magic link, session management integrato |
| **Grammy** | Telegram bot framework | Migliore DX in TS, supporto conversazioni stateful (conversations plugin), middleware pattern, attivamente mantenuto. Alternativa scartata: node-telegram-bot-api (API-level, niente state management) |
| **Anthropic SDK (Claude claude-sonnet-4-6)** | AI agent document extraction | Eccellente per structured output con tool use, ragionamento su testi normativi italiani. Claude claude-sonnet-4-6 è il modello più capace disponibile |
| **@react-pdf/renderer** | Generazione PDF schede pratica | Rendering React → PDF, ottimo per layout strutturati, nessuna dipendenza nativa C++ |
| **Zod** | Validation schema | Runtime type safety, integrazione perfetta con TypeScript e tRPC-pattern |
| **mammoth** | Parsing DOCX | Puro JS, nessuna dipendenza nativa, buona estrazione testo da .docx |
| **pdf-parse** | Parsing PDF testo | Estrazione testo da PDF, leggero |
| **Cheerio** | Parsing HTML | jQuery-like per HTML scraping, leggero vs Puppeteer per pagine statiche |
| **date-fns** | Manipolazione date | Leggero, tree-shakeable, immutabile. Critico per calcoli finestre temporali accordi |
| **Vitest** | Testing | Veloce, compatibile ESM, stesso config di Vite |
| **tsx / ts-node** | Run scripts TS | Per pipeline import e scripts operativi |

---

## Architettura sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        CANDIDATO                                 │
│                    (smartphone, qualsiasi lingua)                │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Link univoco (case_id + token)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TELEGRAM BOT (Grammy)                          │
│  - Conversation stateful (sessione in DB)                        │
│  - Multilingua (i18n strings)                                    │
│  - Raccolta: lingua, foto patente, dati, permesso soggiorno      │
│  - Upload foto → storage sicuro                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ POST /api/telegram/webhook
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS APP (API Routes)                        │
│                                                                  │
│  ┌─────────────────────┐    ┌──────────────────────────────┐    │
│  │   RULES ENGINE      │    │      AI AGENT                │    │
│  │   (deterministico)  │    │   (document extraction)      │    │
│  │                     │    │                              │    │
│  │  Input: dati caso   │    │  Input: DOCX/PDF/HTML        │    │
│  │  Output:            │    │  Output: JSON normalizzato   │    │
│  │  - classification   │    │  - proposte aggiornamento    │    │
│  │  - reasons          │    │  - diff report               │    │
│  │  - required_docs    │    │                              │    │
│  │  - missing_info     │    │  Usa Claude API              │    │
│  └─────────┬───────────┘    └──────────────────────────────┘    │
│            │                                                      │
│  ┌─────────▼──────────────────────────────────────────────┐     │
│  │              NEON DB (PostgreSQL)                        │     │
│  │  - autoscuole, operatori                                │     │
│  │  - pratiche, candidati                                  │     │
│  │  - dataset normativo (paesi, accordi, documenti)        │     │
│  │  - sessioni telegram                                    │     │
│  │  - fonti normative versionate                           │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DASHBOARD OPERATORE (Next.js SSR)               │
│  - Lista pratiche + filtri                                       │
│  - Dettaglio pratica (dati + motivazioni + checklist + file)    │
│  - Upload documenti mancanti                                     │
│  - Note operative                                                │
│  - Export PDF scheda pratica                                     │
│  - Sezione dataset normativo (view/update via AI agent)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pattern multi-tenancy

Ogni autoscuola è isolata tramite `autoscuola_id` in ogni tabella dati.

**Strategia**: Row-Level Security (RLS) a livello applicativo + foreign key constraint.
- Non usiamo RLS PostgreSQL nativo per semplicità del layer applicativo, ma ogni query include sempre `WHERE autoscuola_id = :current_autoscuola_id`
- Verificato via middleware Auth.js che inietta il context della sessione
- Mai esporre dati cross-tenant via API

---

## Flusso dati principale

```
1. Autoscuola crea pratica → genera link Telegram (case_id + signed token JWT)
2. Candidato apre bot → bot verifica token → inizia conversazione
3. Bot raccoglie dati → salva sessione in telegram_sessions
4. Bot completa intake → chiama POST /api/cases/:id/evaluate
5. Rules engine valuta → salva classification + reasons + required_docs
6. Bot risponde al candidato nella sua lingua con risultato
7. Operatore vede pratica in dashboard → gestisce documenti → esporta PDF
```

---

## Sicurezza file/documenti

- I file (foto patenti, permessi) NON vanno su disco locale
- Storage: **Vercel Blob** (semplice, integrato) o **Cloudflare R2** (economico)
- Accesso firmato con URL temporanei (signed URLs, TTL 1h)
- Nessun file esposto pubblicamente
- Vedi `docs/SECURITY.md` per dettagli

---

## Deployment

- **App Next.js**: Vercel (zero-config, edge functions per webhook Telegram)
- **Bot Telegram**: webhook mode (non polling) — il webhook punta all'API route Next.js
- **DB**: Neon (serverless PostgreSQL, branching per ambienti)
- **Storage file**: Vercel Blob o Cloudflare R2
- Vedi `docs/DEPLOYMENT.md`

---

## Struttura cartelle `src/`

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Auth guard + sidebar
│   │   ├── pratiche/
│   │   │   ├── page.tsx            # Lista pratiche
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Dettaglio pratica
│   │   ├── dataset/
│   │   │   └── page.tsx            # Gestione dataset normativo
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── cases/
│   │   │   ├── route.ts            # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts        # GET, PATCH, DELETE
│   │   │       ├── evaluate/route.ts
│   │   │       ├── documents/route.ts
│   │   │       └── export-pdf/route.ts
│   │   ├── telegram/
│   │   │   └── webhook/route.ts
│   │   └── agent/
│   │       └── extract/route.ts
│   └── layout.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts                # Drizzle client + Neon connection
│   │   ├── schema.ts               # Schema completo
│   │   └── migrations/             # Drizzle migrations
│   ├── rules-engine/
│   │   ├── index.ts                # Entry point
│   │   ├── types.ts                # Input/Output types
│   │   ├── classifier.ts           # Logica classificazione
│   │   ├── document-resolver.ts    # Risolve required_docs da DB
│   │   └── __tests__/
│   │       └── classifier.test.ts
│   ├── telegram/
│   │   ├── bot.ts                  # Grammy bot instance
│   │   ├── conversations/
│   │   │   └── intake.ts           # Conversazione intake
│   │   ├── handlers/
│   │   │   ├── start.ts
│   │   │   └── callbacks.ts
│   │   └── i18n/
│   │       ├── it.json
│   │       ├── en.json
│   │       ├── ar.json
│   │       └── ...
│   ├── agent/
│   │   ├── index.ts                # AI agent entry point
│   │   ├── tools.ts                # Claude tool definitions
│   │   ├── extractors/
│   │   │   ├── docx.ts
│   │   │   ├── pdf.ts
│   │   │   └── html.ts
│   │   └── normalizer.ts           # JSON normalization
│   ├── pdf/
│   │   ├── template.tsx            # @react-pdf/renderer template
│   │   └── generator.ts
│   └── auth/
│       └── config.ts               # Auth.js config
└── components/
    ├── ui/                         # Primitive UI (button, badge, etc.)
    ├── pratiche/                   # Componenti pratiche
    ├── dataset/                    # Componenti dataset
    └── layout/                     # Sidebar, header
```

---

## Note su scalabilità

L'MVP è progettato per **50-200 autoscuole** con un volume di pratiche ragionevole (decine/mese per autoscuola). Non è progettato per milioni di utenti.

Se il prodotto cresce:
- Aggiungere Redis per sessioni Telegram (oggi in DB, va bene per MVP)
- Separare bot Telegram in microservizio dedicato
- Aggiungere job queue (BullMQ/Inngest) per AI agent asincrono
- CDN per PDF generati
