# CHANGELOG.md — ConvertoPatenti

Formato: [Data] | [Tipo] | [Cosa] | [Perché]

---

## 2026-02-24 | FEAT | Fase 7: PDF generator completo + login redesign

### Aggiunto
- `src/lib/pdf/scheda-pratica.tsx` — template React PDF "Scheda Pratica Autoscuola" (1 pagina A4)
- `src/lib/pdf/scheda-esami.tsx` — template React PDF "Scheda Avvio Percorso Esami" (1 pagina A4)
- `src/lib/pdf/tt2112-mapping.ts` — mapping dati pratica → campi TT2112
- `src/lib/pdf/tt2112-filler.ts` — fill form fields TT2112 originale con pdf-lib (30 campi)
- `src/lib/pdf/documents-generator.ts` — orchestrator: genera i documenti giusti per classificazione
- `src/app/api/cases/[id]/documents/route.ts` — GET lista + POST genera/rigenera documenti
- `src/components/pratiche/generate-docs-button.tsx` — pulsante client-side genera con feedback
- `data/sources/tt2112/tt2112-editabile.pdf` — modulo ufficiale originale versionato
- Schema DB: tabella `documenti_generati` (id, praticaId, tipoDocumento, storageKey, nomeFile, versione)

### Logica attivazione
- LIKELY_CONVERTIBLE → Scheda Pratica + TT2112 precompilato
- NOT_CONVERTIBLE_EXAMS → Scheda Pratica + Scheda Avvio Esami
- NEEDS_REVIEW → Scheda Pratica (solo)

### Modificato
- `src/app/(dashboard)/pratiche/[id]/page.tsx` — sezione "Documenti generati" in sidebar con download
- `src/app/(auth)/login/page.tsx` — redesign full-screen: split layout, left panel brand, right form premium
- `docs/README.md` — Fase 7 aggiornata

---

## 2026-02-18 | FIX | Fix tsc: bot-dev.ts createBot() senza argomenti

### Fix
- `scripts/bot-dev.ts`: rimosso argomento `token` da `createBot()` — la funzione legge
  `TELEGRAM_BOT_TOKEN` da `process.env` direttamente. `tsc --noEmit` ora passa pulito.

---

## 2026-02-18 | FEAT | Fase 9: seed + script bot dev

### Aggiunto
- `scripts/migrate.ts` — esegue Drizzle migrator (richiede `DATABASE_URL`)
- `scripts/seed.ts` — seed dataset normativo + autoscuola demo + 5 pratiche campione con stati diversi
- `scripts/utils/token-sync.ts` — helper JWT per lo script seed
- `scripts/bot-dev.ts` — runner locale Grammy in long-polling (alternativa webhook per dev)

---

## 2026-02-18 | FEAT | Fase 8: AI Agent estrazione documenti normativi

### Aggiunto
- `src/lib/agent/tools.ts` — 4 Claude tool definitions: `extract_countries`,
  `extract_bilateral_agreement`, `extract_required_documents`, `report_uncertainty`
- `src/lib/agent/extractors/docx.ts` — estrazione testo via mammoth
- `src/lib/agent/extractors/pdf.ts` — estrazione testo via pdf-parse (require CJS workaround)
- `src/lib/agent/extractors/html.ts` — estrazione testo + tabelle via cheerio
- `src/lib/agent/index.ts` — `runExtractionAgent()` con loop tool_use Claude (max 10 iter),
  `extractTextFromFile()` dispatcher per tipo MIME
- `src/app/api/agent/extract/route.ts` — POST multipart: hash SHA-256, crea record
  `fontiNormative`, esegue agent, salva risultato pending review

### Architettura
- L'AI non applica mai i dati automaticamente: human-in-the-loop obbligatorio
- Output strutturato con Zod pattern + campo `confidence` per ogni entità estratta

---

## 2026-02-18 | FEAT | Fase 7: PDF generator

### Aggiunto
- `src/lib/pdf/generator.ts` — `generatePraticaPDF(data)` → Buffer via `renderToBuffer`
- `src/lib/pdf/template.tsx` — template `@react-pdf/renderer` con header, box classificazione
  color-coded, motivazioni, dati candidato/patente/residenza, checklist documenti, footer paginato
- `src/app/api/cases/[id]/export-pdf/route.ts` — GET, genera PDF e restituisce `application/pdf`

---

## 2026-02-18 | FEAT | Fase 6: Dashboard operatore

### Aggiunto
- Auth: `src/lib/auth/config.ts` — Auth.js v5 credentials provider con bcrypt, JWT 8h,
  session injection di `autoscuolaId`, `autoscuolaNome`, `ruolo`
- Middleware: `src/middleware.ts` — protezione globale rotte (escluse /login, /api/auth,
  /api/telegram, /api/health)
- Layout: `src/app/layout.tsx`, `src/app/(auth)/layout.tsx`, `src/app/(dashboard)/layout.tsx`
- Pagine: login, lista pratiche (filtri + paginazione), dettaglio pratica completo,
  dataset normativo, impostazioni
- Componenti: `ClassificationBadge`, `StatoBadge`, `NuovaPraticaButton` (con copia link Telegram),
  `NoteForm`, `ReevaluateButton`, sidebar navigazione

### API Routes
- `GET/POST /api/cases` — lista filtrata + creazione (genera JWT Telegram)
- `GET/PATCH/DELETE /api/cases/[id]` — dettaglio, aggiornamento stato, archivio soft
- `POST /api/cases/[id]/evaluate` — riesegue rules engine, aggiorna classificazione in DB
- `POST /api/cases/[id]/notes` — aggiunta nota operatore
- `GET /api/cases/[id]/export-pdf` — generazione PDF
- `GET /api/health` — ping DB + versione dataset

---

## 2026-02-18 | FEAT | Fase 5: Telegram bot (Grammy)

### Aggiunto
- `src/lib/telegram/types.ts` — `BotContext` con SessionFlavor + ConversationFlavor
- `src/lib/telegram/i18n/strings.ts` — i18n completo per it/en/ar (full), + 9 locale fallback a en
- `src/lib/telegram/token.ts` — JWT sign/verify con jose (30d expiry, payload case_id + autoscuola_id)
- `src/lib/telegram/bot.ts` — factory `createBot()` con session, conversations, /start handler
- `src/lib/telegram/handlers/start.ts` — verifica JWT, carica pratica, mostra tastiera lingua
- `src/lib/telegram/conversations/intake.ts` — conversazione 11-step: lingua→nome→paese→
  categoria→date patente→residenza→soggiorno→foto→riepilogo→elaborazione→risultato.
  Chiama rules engine, salva classificazione in DB.
- `src/lib/telegram/utils/date.ts` — parser date flessibile (DD/MM/YYYY, ISO, ecc.)
- `src/lib/telegram/utils/country-lookup.ts` — fuzzy match paese da testo libero
- `src/app/api/telegram/webhook/route.ts` — POST con verifica `X-Telegram-Bot-Api-Secret-Token`

---

## 2026-02-18 | FEAT | Fase 4: Rules Engine + Dataset normativo

### Aggiunto
- `data/countries.json` — 65+ paesi con ISO, zone, agreement_id
- `data/agreements.json` — 18 accordi bilaterali con categorie, condizioni temporali, scadenze
- `data/documents-config.json` — 12 tipologie documento + 5 config requisiti per zona/categoria
- `src/lib/rules-engine/types.ts` — interfacce `NormativeDataset`, `RulesEngineInput`, `RulesEngineOutput`
- `src/lib/rules-engine/classifier.ts` — funzione pura `evaluate(input, dataset)` deterministica
- `src/lib/rules-engine/index.ts` — `loadDataset()` da JSON, wrapper `evaluateWithDataset()`
- `src/lib/rules-engine/__tests__/classifier.test.ts` — **19 test, tutti verdi**

### Test copertura
EU/EEA (3), accordi bilaterali (5), nessun accordo (2), informazioni mancanti (4), documenti (3),
versione dataset (1). Casi edge: patente scaduta, accordo scaduto, permesso scaduto,
categoria non coperta, condizione temporale ante/post residenza.

---

## 2026-02-18 | FEAT | Fase 3: Schema DB + Auth

### Aggiunto
- `src/lib/db/schema.ts` — schema Drizzle completo (11 tabelle): `fontiNormative`, `paesi`,
  `accordiBilaterali`, `tipologieDocumento`, `documentiRichiesti`, `autoscuole`, `operatori`,
  `pratiche`, `telegramSessioni`, `documentiPratica`, `notePratica`
- `src/lib/db/index.ts` — client Drizzle + Neon HTTP serverless

---

## 2026-02-18 | FEAT | Fase 2: Setup progetto Next.js

### Aggiunto
- `package.json` — dipendenze complete (next 15, drizzle-orm, grammy, @anthropic-ai/sdk,
  @react-pdf/renderer, zod, date-fns, bcryptjs, jose, mammoth, pdf-parse, cheerio, vitest…)
- `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- `drizzle.config.ts`, `vitest.config.ts`
- `.env.example`, `.gitignore`

### Fix installazione
- `@grammyjs/storage-memory` non esiste → sostituito con `@grammyjs/storage-free`
- `vitest` non in PATH → script `test` usa `node_modules/.bin/vitest run`

---

## 2026-02-18 | INIT | Fase 1: Pianificazione e documentazione

### Aggiunto
- `docs/README.md` — Overview prodotto, quick start, struttura repo
- `docs/ARCHITECTURE.md` — Scelte architetturali (Next.js + Drizzle + Grammy + Claude)
- `docs/DATABASE_SCHEMA.md` — Schema completo PostgreSQL/Drizzle (9 tabelle)
- `docs/RULES_ENGINE.md` — Logica classificazione deterministica + test cases
- `docs/TELEGRAM_FLOW.md` — Flusso conversazionale bot candidato (14 step)
- `docs/NORMATIVE_ANALYSIS.md` — Fonti normative + dataset seed iniziale
- `docs/DATA_PIPELINE.md` — Import/versioning dataset + script pipeline
- `docs/AGENT_DESIGN.md` — Design AI agent (Claude + tool use) per estrazione documenti
- `docs/SECURITY.md` — Threat model, multi-tenancy, GDPR, secrets
- `docs/DEPLOYMENT.md` — Setup produzione, CI/CD, env vars
- `docs/API_SPEC.md` — Specifiche API REST complete
- `docs/API_KEYS_NEEDED.md` — Lista chiavi API necessarie con istruzioni

### Decisioni architetturali
- ORM: Drizzle (vs Prisma) — leggero, edge-compatible, type-safe
- Bot: Grammy (vs node-telegram-bot-api) — conversazioni stateful, middleware
- LLM: Claude claude-sonnet-4-6 — ragionamento su testi normativi complessi
- Storage: Vercel Blob — integrazione zero-config con Vercel deploy
- Auth: Auth.js v5 credentials — standard Next.js, flessibile

---

<!-- Template per aggiornamenti futuri:

## YYYY-MM-DD | [FEAT|FIX|REFACTOR|DOCS|SECURITY] | Titolo breve

### Aggiunto / Modificato / Rimosso / Fix / Perché
- ...

-->
