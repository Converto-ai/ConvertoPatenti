# TELEGRAM_FLOW.md — ConvertoPatenti

## Overview

Il bot Telegram è il punto di contatto del **candidato** (non dell'autoscuola).
L'autoscuola genera un link univoco → il candidato lo apre → il bot guida l'intake.

---

## Generazione link candidato

L'operatore crea una nuova pratica dalla dashboard:
```
POST /api/cases
→ crea pratica con stato: 'attesa_candidato'
→ genera telegram_token (JWT firmato, payload: {case_id, autoscuola_id, exp: 30gg})
→ costruisce link: https://t.me/ConvertoPatentiBot?start=<telegram_token>
```

Il link viene mostrato all'operatore e può essere condiviso via WhatsApp/email/SMS al candidato.

---

## Flusso conversazionale (Grammy conversations)

### Step 0: /start con token

```
Bot riceve: /start <token>
  1. Verifica token JWT (firma + scadenza)
  2. Carica pratica dal DB
  3. Verifica che pratica sia in stato 'attesa_candidato'
  4. Inizializza sessione telegram_sessioni
  5. Vai a STEP_LINGUA
```

Errori gestiti:
- Token invalido/scaduto → messaggio errore + invito a contattare autoscuola
- Pratica già completata → messaggio "Hai già completato il questionario"
- Pratica non trovata → errore generico sicuro

---

### STEP_LINGUA — Selezione lingua

```
[Bot] Benvenuto! / Welcome! / مرحبا! / Bienvenue!
Scegli la tua lingua / Choose your language:

[🇮🇹 Italiano] [🇬🇧 English] [🇫🇷 Français] [🇦🇷 العربية]
[🇪🇸 Español]  [🇵🇹 Português] [🇷🇴 Română] [🇺🇦 Українська]
[🇷🇺 Русский]  [🇨🇳 中文]      [🇵🇰 اردو]   [🇵🇭 Filipino]
```

Lingue supportate MVP: it, en, fr, ar, es, pt, ro, uk, ru, zh, ur, tl
→ salva lingua in sessione
→ vai a STEP_INTRO

---

### STEP_INTRO

```
[Bot in lingua scelta]
Ciao! Sono il bot dell'autoscuola [Nome Autoscuola].
Ti aiuterò a raccogliere le informazioni per la conversione della tua patente estera.

📋 Ti farò alcune domande — circa 5 minuti.
📸 Alla fine ti chiederò una foto della tua patente.
🔒 I tuoi dati sono protetti e usati solo dall'autoscuola.

Iniziamo?
[Sì, inizia] [Ho una domanda]
```

---

### STEP_NOME

```
[Bot] Come ti chiami?
Scrivi il tuo nome e cognome completo.

[Utente] Lorenzo Megliola
[Bot] Grazie, Lorenzo! Procediamo.
```

---

### STEP_PAESE

```
[Bot] In quale paese è stata rilasciata la tua patente di guida?
Scrivi il nome del paese (es. "Marocco", "Romania", "Brasile")

[Utente] Marocco
[Bot interno: cerca nel DB paesi, match "Marocco" → "MA"]
[Bot] Ho trovato: 🇲🇦 Marocco. È corretto?
[Sì, corretto] [No, cambia]
```

Logica matching paese:
- Ricerca fuzzy su nome IT/EN
- Se ambiguo: mostra lista opzioni (max 5)
- Se non trovato: chiedi di riprovare o offri lista alfabetica

---

### STEP_CATEGORIA

```
[Bot] Quale categoria di patente hai?
Seleziona dalla lista:

[A - Moto] [A1 - Moto piccola] [A2 - Moto media]
[B - Auto] [B1 - Quadricicli] [BE - Auto + rimorchio]
[C - Camion] [C1 - Camion leggero] [D - Bus]
[Altro / Non so]

(Un pulsante per volta su mobile)
```

---

### STEP_DATA_RILASCIO

```
[Bot] Quando è stata rilasciata la tua patente?
Scrivi la data nel formato GG/MM/AAAA
(es. 15/03/2018)

[Utente] 15/03/2018
[Bot valida formato] ✅ Data: 15 marzo 2018

Se non ricordi la data esatta, guarda la voce "4a" sulla tua patente.
```

---

### STEP_SCADENZA

```
[Bot] La tua patente è ancora valida?
[Sì, è valida] [No, è scaduta] [Non so]

Se SÌ:
[Bot] Quando scade? (GG/MM/AAAA o "Non so")

Se NO:
[Bot] Quando è scaduta? (GG/MM/AAAA)
```

---

### STEP_RESIDENZA

```
[Bot] Quando hai fissato la residenza in Italia per la prima volta?
(Data iscrizione anagrafe)

Scrivi la data (GG/MM/AAAA) o seleziona:
[Non ho ancora la residenza] [Non ricordo l'anno esatto]

Se "Non ho ancora la residenza":
→ segnala info mancante critica, continua
```

---

### STEP_SOGGIORNO (solo se paese NON UE/SEE)

```
[Bot] Che tipo di documento di soggiorno hai?
[Permesso di soggiorno] [Carta di soggiorno] [Cittadinanza italiana] [Non ho ancora il documento]

Se Permesso di soggiorno:
[Bot] Quando scade il tuo permesso di soggiorno? (GG/MM/AAAA)
```

---

### STEP_FOTO_PATENTE

```
[Bot] 📸 Ora ti chiedo una foto della tua patente.

Scatta una foto chiara del FRONTE della tua patente.
Assicurati che:
• La foto sia nitida e leggibile
• Tutti i dati siano visibili
• Non ci siano riflessi

Invia la foto adesso (o digita "salta" se non hai la patente con te)
```

Il file photo viene:
1. Scaricato dall'API Telegram
2. Uploadato su Vercel Blob con chiave `pratiche/{case_id}/patente_fronte_{timestamp}.jpg`
3. Salvato in `documenti_pratica`

---

### STEP_RIEPILOGO

```
[Bot] Perfetto! Ecco un riepilogo delle tue informazioni:

👤 Nome: Lorenzo Megliola
🌍 Paese patente: 🇲🇦 Marocco
📋 Categoria: B (Auto)
📅 Data rilascio: 15 marzo 2018
✅ Patente valida: Sì (scade: 15 marzo 2028)
🏠 Residenza in Italia dal: 10 gennaio 2020
📄 Soggiorno: Permesso di soggiorno (scade: 01/06/2025)

Le informazioni sono corrette?
[✅ Sì, conferma] [✏️ Modifica qualcosa]
```

Se l'utente vuole modificare: menu pulsanti con ogni campo da modificare.

---

### STEP_ELABORAZIONE

```
[Bot] ⏳ Sto elaborando le tue informazioni...

[Bot dopo 2-3 sec] ✅ Elaborazione completata!
```

→ Chiama `POST /api/cases/{id}/evaluate` internamente
→ Rules engine classifica il caso

---

### STEP_RISULTATO

**Caso LIKELY_CONVERTIBLE:**
```
[Bot] 🎉 Buone notizie!

In base alle informazioni fornite, la tua patente sembra **convertibile** direttamente.

📋 Documenti che ti verranno richiesti:
1. Patente originale
2. Copia traduzione asseverata
3. Documento di identità
4. Permesso di soggiorno valido
5. Marca da bollo
[continua...]

L'autoscuola ti contatterà per i dettagli sui prossimi passi.
Hai domande? Contatta direttamente l'autoscuola.

[📞 Contatta autoscuola]
```

**Caso NOT_CONVERTIBLE_EXAMS:**
```
[Bot] ℹ️ Risultato valutazione

In base alle informazioni fornite, la conversione diretta non è possibile per la tua situazione.

Motivo: [es. "Non esiste un accordo bilaterale tra Italia e il tuo paese"]

Questo significa che dovrai sostenere:
• Esame teorico (quiz)
• Esame pratico di guida

L'autoscuola può iscriverti ai corsi necessari.
Ti contatteranno presto.
```

**Caso NEEDS_REVIEW:**
```
[Bot] ⚠️ Valutazione in corso

Le informazioni raccolte richiedono una verifica manuale da parte dell'operatore.

Motivo: [es. "Data di residenza non fornita — necessaria per valutare il caso"]

Un operatore dell'autoscuola esaminerà la tua pratica e ti contatterà entro 1-2 giorni lavorativi.
```

---

## Stati conversazione

```
start → lingua → intro → nome → paese → categoria →
data_rilascio → scadenza → residenza → [soggiorno] →
foto_patente → riepilogo → elaborazione → risultato → completato
```

Ogni step è salvato in `telegram_sessioni.stato_conv`.
Se l'utente abbandona e ritorna → riprende dall'ultimo step.

---

## Gestione errori bot

- **Input non valido**: "Non ho capito. [ripeti domanda]"
- **Foto non leggibile**: "La foto non è sufficientemente chiara. Riprova."
- **Timeout sessione (30gg)**: "La sessione è scaduta. Contatta l'autoscuola."
- **Errore sistema**: "Si è verificato un errore. Contatta l'autoscuola." (log interno)
- **Comando /cancel**: "Hai annullato. Puoi riprendere quando vuoi tramite lo stesso link."

---

## Webhook setup

```
POST https://api.telegram.org/bot{TOKEN}/setWebhook
  url: https://convertopatenti.com/api/telegram/webhook
  secret_token: {WEBHOOK_SECRET}
  allowed_updates: ["message", "callback_query"]
```

Il webhook è gestito da una Next.js API Route con verifica della firma Telegram.

---

## Internazionalizzazione (i18n)

File per lingua in `src/lib/telegram/i18n/{lang}.json`:
```json
{
  "welcome": "Benvenuto! Scegli la tua lingua:",
  "step_nome_question": "Come ti chiami? Scrivi nome e cognome completo.",
  "step_paese_question": "In quale paese è stata rilasciata la tua patente?",
  "result_convertible_title": "🎉 Buone notizie!",
  ...
}
```

Le stringhe del risultato finale (motivazioni rules engine) sono generate in italiano e poi tradotte con una chiamata Claude API (opzionale, fallback: inglese).
