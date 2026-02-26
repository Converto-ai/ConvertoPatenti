import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── NORMATIVE DATASET TABLES ────────────────────────────────────────────────

export const fontiNormative = pgTable("fonti_normative", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(), // url | docx | pdf | html
  urlOriginale: text("url_originale"),
  storageKey: text("storage_key"),
  hashContenuto: text("hash_contenuto"),
  dataAcquisizione: timestamp("data_acquisizione", { withTimezone: true })
    .notNull()
    .defaultNow(),
  versione: text("versione").notNull(),
  estrattoJson: jsonb("estratto_json"),
  diffJson: jsonb("diff_json"),
  statoReview: text("stato_review").notNull().default("pending"),
  // pending | reviewed | applied | rejected
  note: text("note"),
  applicatoDa: uuid("applicato_da"),
  applicatoAt: timestamp("applicato_at", { withTimezone: true }),
});

export const paesi = pgTable("paesi", {
  id: uuid("id").primaryKey().defaultRandom(),
  codiceIso: text("codice_iso").notNull().unique(),
  nomeIt: text("nome_it").notNull(),
  nomeEn: text("nome_en").notNull(),
  zona: text("zona").notNull(),
  // eu_eea | bilateral_agreement | no_agreement
  isEuEea: boolean("is_eu_eea").notNull().default(false),
  haAccordo: boolean("ha_accordo").notNull().default(false),
  accordoId: uuid("accordo_id"),
  note: text("note"),
  versioneDataset: text("versione_dataset").notNull(),
  fonteId: uuid("fonte_id").references(() => fontiNormative.id),
  attivo: boolean("attivo").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accordiBilaterali = pgTable("accordi_bilaterali", {
  id: uuid("id").primaryKey().defaultRandom(),
  paeseIso: text("paese_iso").notNull(),
  dataInizio: date("data_inizio"),
  dataFine: date("data_fine"),
  inVigore: boolean("in_vigore").notNull().default(true),
  categorie: text("categorie").array().notNull().default([]),
  condizioneTemporale: text("condizione_temporale"),
  // rilascio_ante_residenza | entro_anni_residenza | nessuna
  anniDallaResidenza: integer("anni_dalla_residenza"),
  richiedeEsameTeo: boolean("richiede_esame_teoria").notNull().default(false),
  richiedeEsamePra: boolean("richiede_esame_pratica").notNull().default(false),
  reciproco: boolean("reciproco").notNull().default(true),
  note: text("note"),
  riferimentoNormativo: text("riferimento_normativo"),
  versioneDataset: text("versione_dataset").notNull(),
  fonteId: uuid("fonte_id").references(() => fontiNormative.id),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tipologieDocumento = pgTable("tipologie_documento", {
  id: uuid("id").primaryKey().defaultRandom(),
  codice: text("codice").notNull().unique(),
  nomeIt: text("nome_it").notNull(),
  nomeEn: text("nome_en").notNull(),
  descrizione: text("descrizione"),
  istruzioniIt: text("istruzioni_it"),
  istruzioniEn: text("istruzioni_en"),
  attivo: boolean("attivo").notNull().default(true),
});

export const documentiRichiesti = pgTable("documenti_richiesti_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  zona: text("zona"), // eu_eea | bilateral_agreement | no_agreement | null = tutti
  paeseIso: text("paese_iso"), // null = tutta la zona
  categoria: text("categoria"), // null = tutte
  tipologiaId: uuid("tipologia_id")
    .notNull()
    .references(() => tipologieDocumento.id),
  obbligatorio: boolean("obbligatorio").notNull().default(true),
  condizionale: text("condizionale"),
  ordine: integer("ordine").notNull().default(0),
  versioneDataset: text("versione_dataset").notNull(),
  attivo: boolean("attivo").notNull().default(true),
});

// ─── AUTOSCUOLE & OPERATORI ───────────────────────────────────────────────────

export const autoscuole = pgTable("autoscuole", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  codiceFiscale: text("codice_fiscale").unique(),
  indirizzo: text("indirizzo"),
  citta: text("citta"),
  email: text("email").notNull().unique(),
  telefono: text("telefono"),
  piano: text("piano").notNull().default("trial"),
  // trial | base | pro
  pianoScadenza: timestamp("piano_scadenza", { withTimezone: true }),
  attiva: boolean("attiva").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const operatori = pgTable("operatori", {
  id: uuid("id").primaryKey().defaultRandom(),
  autoscuolaId: uuid("autoscuola_id")
    .notNull()
    .references(() => autoscuole.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  cognome: text("cognome").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  ruolo: text("ruolo").notNull().default("operatore"),
  // admin | operatore
  attivo: boolean("attivo").notNull().default(true),
  ultimoAccesso: timestamp("ultimo_accesso", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── PRATICHE ─────────────────────────────────────────────────────────────────

export const pratiche = pgTable("pratiche", {
  id: uuid("id").primaryKey().defaultRandom(),
  autoscuolaId: uuid("autoscuola_id")
    .notNull()
    .references(() => autoscuole.id, { onDelete: "cascade" }),
  operatoreId: uuid("operatore_id").references(() => operatori.id),

  // Telegram link
  telegramToken: text("telegram_token").notNull().unique(),
  telegramChatId: text("telegram_chat_id"),

  // Stato
  stato: text("stato").notNull().default("attesa_candidato"),
  // attesa_candidato | intake_in_corso | valutazione | completata | archiviata

  // Candidato
  candidatoNome: text("candidato_nome"),
  candidatoCognome: text("candidato_cognome"),
  candidatoSesso: text("candidato_sesso"), // M | F
  candidatoNascita: date("candidato_nascita"),
  candidatoLuogoNascita: text("candidato_luogo_nascita"), // comune di nascita
  candidatoStatoNascita: text("candidato_stato_nascita"), // paese di nascita
  candidatoCodiceFiscale: text("candidato_codice_fiscale"),
  candidatoNazionalita: text("candidato_nazionalita"),
  candidatoLingua: text("candidato_lingua").default("it"),

  // Patente
  paeseRilascio: text("paese_rilascio"),
  categoriaPatente: text("categoria_patente"),
  dataRilascioPatente: date("data_rilascio_patente"),
  dataScadenzaPatente: date("data_scadenza_patente"),
  patenteValida: boolean("patente_valida"),
  numeroPatente: text("numero_patente"),

  // Tipo istanza TT2112
  tipoIstanza: text("tipo_istanza"),
  // esami | conversione | riclassificazione

  // Residenza / soggiorno
  dataPrimaResidenza: date("data_prima_residenza"),
  tipoSoggiorno: text("tipo_soggiorno"),
  // cittadino_eu | permesso_soggiorno | carta_soggiorno
  scadenzaPermesso: date("scadenza_permesso"),

  // Indirizzo italiano (per TT2112)
  residenzaComune: text("residenza_comune"),
  residenzaProvincia: text("residenza_provincia"),
  residenzaIndirizzo: text("residenza_indirizzo"),
  residenzaCivico: text("residenza_civico"),
  residenzaCap: text("residenza_cap"),

  // Rules engine output
  classificazione: text("classificazione"),
  // LIKELY_CONVERTIBLE | NOT_CONVERTIBLE_EXAMS | NEEDS_REVIEW
  classificazioneReasons: jsonb("classificazione_reasons").default([]),
  documentiRichiestiOutput: jsonb("documenti_richiesti_output").default([]),
  infoMancanti: jsonb("info_mancanti").default([]),
  classificazioneAt: timestamp("classificazione_at", { withTimezone: true }),
  classificazioneVersione: text("classificazione_versione"),

  // Operatore
  noteOperatore: text("note_operatore"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const telegramSessioni = pgTable("telegram_sessioni", {
  chatId: text("chat_id").primaryKey(),
  praticaId: uuid("pratica_id").references(() => pratiche.id, {
    onDelete: "cascade",
  }),
  statoCon: text("stato_conv").notNull().default("start"),
  datiRaccolti: jsonb("dati_raccolti").notNull().default({}),
  stepCorrente: integer("step_corrente").notNull().default(0),
  lingua: text("lingua").notNull().default("it"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const documentiPratica = pgTable("documenti_pratica", {
  id: uuid("id").primaryKey().defaultRandom(),
  praticaId: uuid("pratica_id")
    .notNull()
    .references(() => pratiche.id, { onDelete: "cascade" }),
  autoscuolaId: uuid("autoscuola_id")
    .notNull()
    .references(() => autoscuole.id, { onDelete: "cascade" }),
  nomeOriginale: text("nome_originale").notNull(),
  tipoDocumento: text("tipo_documento").notNull(),
  // foto_patente | permesso_soggiorno | passaporto | altro
  storageKey: text("storage_key").notNull(),
  mimeType: text("mime_type").notNull(),
  dimensioneBytes: integer("dimensione_bytes"),
  caricatoDa: text("caricato_da").notNull(),
  // candidato_telegram | operatore_dashboard
  operatoreId: uuid("operatore_id").references(() => operatori.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const documentiGenerati = pgTable("documenti_generati", {
  id: uuid("id").primaryKey().defaultRandom(),
  praticaId: uuid("pratica_id")
    .notNull()
    .references(() => pratiche.id, { onDelete: "cascade" }),
  autoscuolaId: uuid("autoscuola_id")
    .notNull()
    .references(() => autoscuole.id, { onDelete: "cascade" }),
  tipoDocumento: text("tipo_documento").notNull(),
  // scheda_pratica | tt2112 | scheda_esami
  storageKey: text("storage_key").notNull(),
  nomeFile: text("nome_file").notNull(),
  versione: integer("versione").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notePratica = pgTable("note_pratica", {
  id: uuid("id").primaryKey().defaultRandom(),
  praticaId: uuid("pratica_id")
    .notNull()
    .references(() => pratiche.id, { onDelete: "cascade" }),
  operatoreId: uuid("operatore_id")
    .notNull()
    .references(() => operatori.id),
  testo: text("testo").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const autoscuoleRelations = relations(autoscuole, ({ many }) => ({
  operatori: many(operatori),
  pratiche: many(pratiche),
}));

export const operatoriRelations = relations(operatori, ({ one, many }) => ({
  autoscuola: one(autoscuole, {
    fields: [operatori.autoscuolaId],
    references: [autoscuole.id],
  }),
  pratiche: many(pratiche),
  note: many(notePratica),
}));

export const praticheRelations = relations(pratiche, ({ one, many }) => ({
  autoscuola: one(autoscuole, {
    fields: [pratiche.autoscuolaId],
    references: [autoscuole.id],
  }),
  operatore: one(operatori, {
    fields: [pratiche.operatoreId],
    references: [operatori.id],
  }),
  documenti: many(documentiPratica),
  note: many(notePratica),
  sessione: one(telegramSessioni, {
    fields: [pratiche.id],
    references: [telegramSessioni.praticaId],
  }),
}));

export const paesiRelations = relations(paesi, ({ one }) => ({
  accordo: one(accordiBilaterali, {
    fields: [paesi.accordoId],
    references: [accordiBilaterali.id],
  }),
  fonte: one(fontiNormative, {
    fields: [paesi.fonteId],
    references: [fontiNormative.id],
  }),
}));

export const documentiRichiestiRelations = relations(
  documentiRichiesti,
  ({ one }) => ({
    tipologia: one(tipologieDocumento, {
      fields: [documentiRichiesti.tipologiaId],
      references: [tipologieDocumento.id],
    }),
  })
);

export const documentiPraticaRelations = relations(
  documentiPratica,
  ({ one }) => ({
    pratica: one(pratiche, {
      fields: [documentiPratica.praticaId],
      references: [pratiche.id],
    }),
    operatore: one(operatori, {
      fields: [documentiPratica.operatoreId],
      references: [operatori.id],
    }),
  })
);

export const documentiGeneratiRelations = relations(
  documentiGenerati,
  ({ one }) => ({
    pratica: one(pratiche, {
      fields: [documentiGenerati.praticaId],
      references: [pratiche.id],
    }),
  })
);

export const notePraticaRelations = relations(notePratica, ({ one }) => ({
  pratica: one(pratiche, {
    fields: [notePratica.praticaId],
    references: [pratiche.id],
  }),
  operatore: one(operatori, {
    fields: [notePratica.operatoreId],
    references: [operatori.id],
  }),
}));

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type Autoscuola = typeof autoscuole.$inferSelect;
export type NewAutoscuola = typeof autoscuole.$inferInsert;
export type Operatore = typeof operatori.$inferSelect;
export type NewOperatore = typeof operatori.$inferInsert;
export type Pratica = typeof pratiche.$inferSelect;
export type NewPratica = typeof pratiche.$inferInsert;
export type Paese = typeof paesi.$inferSelect;
export type AccordoBilaterale = typeof accordiBilaterali.$inferSelect;
export type TipologiaDocumento = typeof tipologieDocumento.$inferSelect;
export type DocumentoRichiesto = typeof documentiRichiesti.$inferSelect;
export type FonteNormativa = typeof fontiNormative.$inferSelect;
export type DocumentoPratica = typeof documentiPratica.$inferSelect;
export type NotaPratica = typeof notePratica.$inferSelect;
export type TelegramSessione = typeof telegramSessioni.$inferSelect;
export type DocumentoGenerato = typeof documentiGenerati.$inferSelect;
export type NewDocumentoGenerato = typeof documentiGenerati.$inferInsert;
