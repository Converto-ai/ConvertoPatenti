import type { Context, SessionFlavor } from "grammy";
import type { Locale } from "./i18n/strings";

/** Steps of the intake state machine */
export type IntakeStep =
  | "idle"
  | "language"
  | "intro"
  | "nome"
  | "sesso"
  | "nascita"
  | "luogo_nascita"
  | "codice_fiscale"
  | "paese"
  | "paese_confirm"
  | "categoria"
  | "tipo_istanza"
  | "data_rilascio"
  | "scadenza"
  | "scadenza_date"
  | "residenza"
  | "soggiorno"
  | "soggiorno_scadenza"
  | "residenza_comune"
  | "residenza_indirizzo"
  | "foto"
  | "riepilogo"
  | "done";

export interface SessionData {
  locale: Locale;
  step: IntakeStep;
  praticaId?: string;
  autoscuolaId?: string;
  autoscuolaNome?: string;
  // Dati anagrafici
  candidatoNome?: string;
  candidatoCognome?: string;
  candidatoSesso?: string; // M | F
  candidatoNascita?: string; // ISO date
  candidatoLuogoNascita?: string;
  candidatoStatoNascita?: string;
  candidatoCodiceFiscale?: string;
  // Patente
  paeseIso?: string;
  paeseNome?: string;
  categoriaPatente?: string;
  tipoIstanza?: string; // esami | conversione | riclassificazione
  dataRilascio?: string;
  patenteValida?: boolean | null;
  dataScadenza?: string;
  // Residenza / soggiorno
  dataPrimaResidenza?: string;
  tipoSoggiorno?: string | null;
  scadenzaPermesso?: string;
  isEuEea?: boolean;
  // Indirizzo italiano
  residenzaComune?: string;
  residenzaProvincia?: string;
  residenzaIndirizzo?: string;
  residenzaCivico?: string;
  residenzaCap?: string;
}

export type BotContext = Context & SessionFlavor<SessionData>;
