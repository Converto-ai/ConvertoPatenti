# DEPLOYMENT.md — ConvertoPatenti

## Ambienti

| Ambiente | URL | Branch | DB |
|---------|-----|--------|-----|
| Development | localhost:3000 | feature/* | Neon branch: dev |
| Staging | staging.convertopatenti.com | main | Neon branch: staging |
| Production | convertopatenti.com | main (tagged) | Neon branch: main |

---

## Stack hosting

| Componente | Servizio | Piano |
|-----------|---------|-------|
| Next.js App | Vercel | Pro (per webhook edge function) |
| Database | Neon | Launch (serverless PostgreSQL) |
| File storage | Vercel Blob | Pay-per-use |
| Bot Telegram | Vercel (stessa app, webhook) | — |

**Nota**: Il bot Telegram gira come webhook dentro Next.js — nessun server separato.
In futuro (se volume alto): separare bot in Railway/Fly.io dedicato.

---

## Setup produzione (checklist)

### 1. Neon DB

```bash
# Crea progetto Neon
# Crea branch: main, staging, dev

# Ottieni connection string
# Es: postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 2. Vercel

```bash
# Collega repo GitHub a Vercel
# Configura environment variables (vedi lista sotto)
# Deploy automatico da main → production

vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add TELEGRAM_WEBHOOK_SECRET production
vercel env add TELEGRAM_LINK_SECRET production
vercel env add ANTHROPIC_API_KEY production
vercel env add BLOB_READ_WRITE_TOKEN production
vercel env add NEXTAUTH_URL production  # https://convertopatenti.com
```

### 3. Telegram webhook

```bash
# Dopo il deploy, registra il webhook
curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://convertopatenti.com/api/telegram/webhook",
    "secret_token": "{WEBHOOK_SECRET}",
    "allowed_updates": ["message", "callback_query"]
  }'

# Verifica
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo
```

### 4. DB Migrations

```bash
# Esegui migrazioni su produzione
DATABASE_URL="<prod_url>" npm run db:migrate

# Seed dataset normativo
DATABASE_URL="<prod_url>" npm run db:seed

# Verifica
DATABASE_URL="<prod_url>" npm run db:studio
```

---

## Environment variables

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=<random 32+ chars>
NEXTAUTH_URL=https://convertopatenti.com

# Telegram
TELEGRAM_BOT_TOKEN=<da @BotFather>
TELEGRAM_WEBHOOK_SECRET=<random 32+ chars>
TELEGRAM_LINK_SECRET=<random 32+ chars>

# AI Agent
ANTHROPIC_API_KEY=<da console.anthropic.com>

# Storage
BLOB_READ_WRITE_TOKEN=<da Vercel Blob>

# Opzionale: logging
LOG_LEVEL=info
SENTRY_DSN=<se usi Sentry>
```

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Backup e disaster recovery

- **DB Neon**: backup automatico point-in-time (PITR) incluso nel piano
- **File Vercel Blob**: replicati automaticamente
- **Codice**: GitHub (source of truth)
- **Dataset normativo**: versionato in git (data/ directory)

Recovery point objective (RPO): 24h
Recovery time objective (RTO): 2h

---

## Monitoring (MVP minimal)

- **Vercel Analytics**: traffic e performance
- **Neon console**: query performance, connessioni
- **Telegram BotFather**: status bot
- **Uptime**: UptimeRobot free tier su https://convertopatenti.com/api/health

Health check endpoint:
```
GET /api/health
→ { status: "ok", db: "ok", version: "..." }
```

---

## Rollback

```bash
# Vercel: rollback a deployment precedente dalla dashboard
# Oppure:
vercel rollback <deployment-url>

# DB: se migrazione errata
# Neon: restore da snapshot PITR
# Oppure: migration down (implementare down migrations in Drizzle)
```

---

## Scaling considerazioni

MVP: Vercel serverless + Neon serverless = scala automaticamente per carichi normali.

Bottleneck attesi a volume:
1. Bot Telegram con molti utenti simultanei → connection pooling Neon (PgBouncer)
2. AI Agent con molte estrazioni → queue asincrona (Inngest o Vercel Cron)
3. PDF generation pesante → cache dei PDF generati

Neon include PgBouncer pooler nella connection string (usare `?pgbouncer=true` per edge functions).
