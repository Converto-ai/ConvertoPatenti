# ConvertoPatenti — README

## Cos'è

**ConvertoPatenti** è un SaaS B2B per autoscuole italiane che automatizza e standardizza la gestione delle pratiche di **conversione patente estera** (art. 135 e 136-bis del Codice della Strada italiano).

Il sistema elimina il lavoro manuale di classificazione del caso, raccolta documenti e predisposizione modulistica, riducendo errori e tempo operativo.

---

## Il problema reale

Le autoscuole affrontano questi problemi quotidianamente:

1. **Complessità normativa**: regole diverse per paese (UE/SEE vs extra-UE vs accordi bilaterali), con finestre temporali, condizioni di residenza, categorie diverse
2. **Fonti documentali frammentate**: Portale Automobilista, circolari MIT, GU — nessun dataset strutturato ufficiale
3. **Errori umani**: classificazione errata → pratica respinta → rifare tutto
4. **Barriere linguistiche**: i candidati spesso non parlano italiano
5. **Burocrazia cartacea**: modulistica TT2112, allegati, checklist documenti

## La soluzione

```
Candidato → Bot Telegram (multilingua) → Raccolta dati + foto documenti
                                              ↓
                              Rules Engine deterministico
                                              ↓
              Output: classificazione + motivazioni + checklist documenti
                                              ↓
                    Dashboard operatore autoscuola → Gestione pratica → PDF export
                              (TT2112 precompilato + Scheda Pratica + Scheda Avvio Esami)
```

---

## Fasi MVP

| Fase | Contenuto | Stato |
|------|-----------|-------|
| 1 | Documentazione e pianificazione | ✅ |
| 2 | Setup progetto (Next.js + Neon + Tailwind) | 🔄 |
| 3 | Modello dati + Auth autoscuola | ⬜ |
| 4 | Dataset normativo + Rules engine + Test | ⬜ |
| 5 | Telegram bot (intake candidato) | ⬜ |
| 6 | Dashboard operatore | ⬜ |
| 7 | PDF generator (TT2112 precompilato + Scheda Pratica + Scheda Avvio Esami) | ✅ |
| 8 | AI Agent documenti | ⬜ |
| 9 | Demo seed + handoff | ⬜ |

---

## Quick Start (sviluppo)

```bash
# 1. Clona e installa
git clone <repo>
cd convertopatenti
npm install

# 2. Configura env
cp .env.example .env.local
# Compila le variabili (vedi docs/API_KEYS_NEEDED.md)

# 3. Migra DB
npm run db:migrate

# 4. Seed normativo
npm run db:seed

# 5. Avvia dev server
npm run dev

# 6. Avvia bot Telegram (separato)
npm run bot:dev
```

---

## Struttura repository

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login autoscuola
│   │   ├── (dashboard)/        # Dashboard operatore
│   │   └── api/                # API Routes
│   ├── lib/
│   │   ├── db/                 # Drizzle ORM + schema
│   │   ├── rules-engine/       # Engine deterministico
│   │   ├── telegram/           # Grammy bot logic
│   │   ├── agent/              # AI agent (doc extraction)
│   │   ├── pdf/                # PDF generation
│   │   └── auth/               # Auth.js config
│   └── components/             # React components UI
├── docs/                       # Tutta la documentazione
├── data/
│   ├── sources/                # Fonti originali versionate
│   ├── countries.json          # Dataset paesi normalizzato
│   └── agreements.json         # Dataset accordi bilaterali
├── scripts/                    # Pipeline import/aggiornamento
└── tests/                      # Test (rules engine, API)
```

---

## Documentazione

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Scelte architetturali motivate
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Schema completo DB
- [RULES_ENGINE.md](./RULES_ENGINE.md) — Logica classificazione
- [TELEGRAM_FLOW.md](./TELEGRAM_FLOW.md) — Flusso conversazionale bot
- [NORMATIVE_ANALYSIS.md](./NORMATIVE_ANALYSIS.md) — Fonti normative e analisi
- [DATA_PIPELINE.md](./DATA_PIPELINE.md) — Import/versioning dataset
- [AGENT_DESIGN.md](./AGENT_DESIGN.md) — Design AI Agent
- [SECURITY.md](./SECURITY.md) — Sicurezza e privacy
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Deploy e operazioni
- [API_SPEC.md](./API_SPEC.md) — Specifiche API REST
- [CHANGELOG.md](./CHANGELOG.md) — Storico modifiche
- [API_KEYS_NEEDED.md](./API_KEYS_NEEDED.md) — Chiavi API necessarie
