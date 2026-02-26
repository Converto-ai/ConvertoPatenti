# NORMATIVE_ANALYSIS.md — ConvertoPatenti

## Base normativa italiana

### Fonti primarie

| Fonte | Tipo | URL/Riferimento | Cosa contiene |
|-------|------|-----------------|---------------|
| Codice della Strada | Legge | Art. 135 D.Lgs. 285/1992 | Conversione patenti UE/SEE |
| Codice della Strada | Legge | Art. 136-bis D.Lgs. 285/1992 | Conversione patenti extra-UE |
| D.M. 17 maggio 1995 | Decreto | GU n.145 del 23/06/1995 | Modalità operative conversione |
| Portale Automobilista | HTML/DOCX | https://www.ilportaledellautomobilista.it | Lista paesi, accordi, modulistica |
| MIT Circolari | PDF/HTML | Ministero Infrastrutture e Trasporti | Aggiornamenti procedurali |
| Gazzetta Ufficiale | HTML/PDF | www.gazzettaufficiale.it | Accordi bilaterali pubblicati |

---

## Struttura della normativa da estrarre

### 1. Lista paesi UE/SEE (conversione diretta)

**Fonte**: Portale Automobilista + CdS art. 135

Paesi attuali UE: Austria, Belgio, Bulgaria, Cipro, Croazia, Danimarca, Estonia, Finlandia, Francia, Germania, Grecia, Irlanda, Italia, Lettonia, Lituania, Lussemburgo, Malta, Paesi Bassi, Polonia, Portogallo, Repubblica Ceca, Romania, Slovacchia, Slovenia, Spagna, Svezia, Ungheria

Paesi SEE (non UE ma accordo speciale): Islanda, Liechtenstein, Norvegia

Casi particolari:
- **UK**: UE fino al 31/12/2020. Post-Brexit: accordo bilaterale transitorio con scadenza
- **Svizzera**: Non UE, accordo bilaterale storico — trattare come category speciale

**Formato estratto atteso:**
```json
{
  "eu_eea_countries": [
    {"iso": "AT", "name_it": "Austria", "name_en": "Austria", "zone": "eu_eea"},
    {"iso": "BE", "name_it": "Belgio", "name_en": "Belgium", "zone": "eu_eea"},
    ...
  ]
}
```

---

### 2. Lista paesi con accordo bilaterale

**Fonte**: Portale Automobilista (DOCX/HTML), circolari MIT

**Accordi bilaterali attivi (dataset seed iniziale, da verificare con fonti)**:

| Paese | ISO | Categorie | Condizione temporale | Note |
|-------|-----|-----------|---------------------|------|
| Albania | AL | B | nessuna | In vigore |
| Algeria | DZ | B | nessuna | Verificare validità |
| Capo Verde | CV | B | nessuna | — |
| Filippine | PH | B | nessuna | — |
| Georgia | GE | B | rilascio_ante_residenza | — |
| Giappone | JP | B | nessuna | — |
| Corea del Sud | KR | B | nessuna | — |
| Macedonia del Nord | MK | B | nessuna | — |
| Moldova | MD | B | nessuna | — |
| Marocco | MA | B | rilascio_ante_residenza | Accordo storico |
| Pakistan | PK | B | — | Verificare stato |
| Serbia | RS | B | nessuna | — |
| Sri Lanka | LK | B | nessuna | — |
| Taiwan | TW | B | nessuna | — |
| Tunisia | TN | B | rilascio_ante_residenza | — |
| Turchia | TR | B | nessuna | — |
| Ucraina | UA | B | nessuna | — |
| Svizzera | CH | B, BE, A | nessuna | Accordo speciale |
| UK | GB | B | — | Post-Brexit: condizioni transitorie, verificare scadenza |

**NOTA CRITICA**: Questi dati sono il punto di partenza per il seed, ma devono essere verificati con le fonti originali (Portale Automobilista, GU) prima del go-live. L'AI Agent è lo strumento per fare questa verifica e normalizzazione.

**Formato estratto atteso:**
```json
{
  "bilateral_agreements": [
    {
      "country_iso": "MA",
      "country_name_it": "Marocco",
      "active": true,
      "effective_date": "1996-01-01",
      "expiry_date": null,
      "categories": ["B"],
      "temporal_condition": "rilascio_ante_residenza",
      "years_from_residency": null,
      "requires_theory_exam": false,
      "requires_practical_exam": false,
      "legal_reference": "Accordo bilaterale MAR-ITA del ...",
      "notes": "..."
    }
  ]
}
```

---

### 3. Documenti richiesti per zona

**Fonte**: Portale Automobilista, modulistica ufficiale, esperienza operativa autoscuole

#### Zona UE/SEE

| Documento | Codice | Obbligatorio | Note |
|-----------|--------|-------------|------|
| Patente originale estera | PATENTE_ORIGINALE | Sì | Verrà trattenuta |
| Documento d'identità | DOCUMENTO_IDENTITA | Sì | Carta identità / passaporto |
| Codice fiscale | CODICE_FISCALE | Sì | Tessera sanitaria o attribuzione |
| Certificato di residenza | RESIDENZA | Sì | Anagrafe |
| Marca da bollo (16€) | MARCA_BOLLO | Sì | Importo aggiornabile |
| Foto formato tessera | FOTO_TESSERA | Sì | 2 foto |
| Modulo TT2112 | MODULO_TT2112 | Sì | Compilato dall'autoscuola |

#### Zona bilateral_agreement (extra-UE con accordo)

| Documento | Codice | Obbligatorio | Note |
|-----------|--------|-------------|------|
| Patente originale estera | PATENTE_ORIGINALE | Sì | — |
| Traduzione asseverata patente | TRADUZIONE_ASSEVERATA | Sì | Da traduttore AIS/tribunale |
| Passaporto | PASSAPORTO | Sì | Originale + copia |
| Permesso/carta di soggiorno | PERMESSO_SOGGIORNO | Sì | In corso di validità |
| Certificato di residenza | RESIDENZA | Sì | — |
| Marca da bollo | MARCA_BOLLO | Sì | — |
| Foto formato tessera | FOTO_TESSERA | Sì | 2 foto |
| Modulo TT2112 | MODULO_TT2112 | Sì | — |
| Certificato autenticità patente | CERT_AUTENTICITA | Condizionale | Alcuni paesi richiedono certificazione dal consolato |

#### Zona no_agreement (extra-UE senza accordo)

Solo per documentare il caso "esami necessari":
| Documento | Codice | Note |
|-----------|--------|------|
| Documento identità | DOCUMENTO_IDENTITA | Per iscrizione a esami |
| Codice fiscale | CODICE_FISCALE | — |

---

## Pattern di estrazione per AI Agent

### Da DOCX (Portale Automobilista)

Il DOCX tipicamente contiene:
- Tabella con colonne: Paese | Accordo | Categorie | Condizioni | Note
- Testo normativo con elenchi puntati
- Date in formato italiano (gg/mm/aaaa o gg mese aaaa)

Prompt extraction strategy:
1. Estrarre testo con mammoth
2. Identificare sezioni: "PAESI CON ACCORDO", "PAESI UE/SEE", "DOCUMENTI RICHIESTI"
3. Per ogni sezione: estrarre struttura tabellare
4. Normalizzare date, nomi paese (→ ISO), categorie (→ array)

### Da HTML (Portale Automobilista)

- Parser Cheerio
- Selettori CSS per tabelle e liste
- Testo descrittivo delle note

### Da PDF (circolari MIT)

- pdf-parse per estrazione testo
- Rilevamento struttura: sezioni, tabelle testuali, elenchi
- Date e riferimenti normativi

---

## Frequenza aggiornamento attesa

| Tipo aggiornamento | Frequenza storica | Trigger |
|-------------------|-------------------|---------|
| Nuovi accordi bilaterali | Rara (1-2/anno) | Firma accordo internazionale |
| Modifica condizioni accordo | Molto rara | Rinegoziazione |
| Documenti richiesti | Occasionale | Circolari MIT |
| Paesi UE/SEE | Rarissima | Allargamento EU |
| Brexit-like eventi | Imprevedibile | — |

**Strategia**: Revisione trimestrale del dataset con AI agent che controlla le fonti.

---

## Disclaimer normativo

Il sistema è basato su dataset derivato da fonti pubbliche.
L'autoscuola è responsabile della verifica finale.
Il software produce pre-classificazioni a supporto, non decisioni legali vincolanti.
Ogni classificazione riporta la versione dataset e le fonti utilizzate.
