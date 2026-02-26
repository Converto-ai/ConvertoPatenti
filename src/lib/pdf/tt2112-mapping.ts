/**
 * Mapping campi form TT2112 → dati pratica
 * Campi reali rilevati dal PDF editabile (30 fields).
 */
export interface TT2112Data {
  cognome?: string;
  nome?: string;
  sesso?: string; // M | F
  luogoDiNascita?: string;
  provinciaNascita?: string;
  stato?: string; // paese nascita
  dataNascita?: string; // DD/MM/YYYY
  cittadinanza?: string;
  codiceFiscale?: string;
  luogoDiResidenza?: string;
  provinciaResidenza?: string;
  indirizzo?: string;
  numeroCivico?: string;
  cap?: string;
  // Patente posseduta (estera da convertire)
  patentePosseduta?: string; // es. "Argentina - B"
  catPosseduta?: string; // categoria posseduta (campo 1)
  catPosseduta1?: string; // campo duplicato 2
  catPosseduta2?: string; // campo duplicato 3
  // Categoria richiesta (italiana)
  catRichiesta?: string;
  catRichiesta1?: string;
  catRichiesta2?: string;
  // Prescrizioni
  prescrizioni?: string;
  // UMC (Ufficio Motorizzazione Civile)
  umc?: string;
  // Autoscuola
  codiceAutoscuola?: string;
  // Data compilazione
  data?: string; // DD/MM/YYYY
  // Checkboxes
  foglioRosa?: boolean;
  duplicato?: boolean;
  riclassificazione?: boolean;
}

/**
 * Converte i dati pratica nei campi TT2112.
 * Lascia vuoti i campi che non abbiamo (non inventa).
 */
export function mapPraticaToTT2112(
  pratica: {
    candidatoNome?: string | null;
    candidatoCognome?: string | null;
    candidatoSesso?: string | null;
    candidatoNascita?: string | null;
    candidatoLuogoNascita?: string | null;
    candidatoStatoNascita?: string | null;
    candidatoCodiceFiscale?: string | null;
    candidatoNazionalita?: string | null;
    paeseRilascio?: string | null;
    paeseNome?: string | null;
    categoriaPatente?: string | null;
    dataRilascioPatente?: string | null;
    tipoIstanza?: string | null;
    residenzaComune?: string | null;
    residenzaProvincia?: string | null;
    residenzaIndirizzo?: string | null;
    residenzaCivico?: string | null;
    residenzaCap?: string | null;
  },
  autoscuolaNome?: string | null
): TT2112Data {
  const formatDate = (d: string | null | undefined): string => {
    if (!d) return "";
    try {
      const date = new Date(d);
      return date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const catItaliana = pratica.categoriaPatente ?? "";

  // Paese completo (nome italiano) per patente posseduta e cittadinanza
  const paeseCompleto = pratica.paeseNome ?? pratica.paeseRilascio ?? "";
  const patentePosseduta = [paeseCompleto, pratica.categoriaPatente]
    .filter(Boolean)
    .join(" - ");

  // Luogo di nascita: solo il comune, il paese va nel campo "Stato"
  const luogoNascitaRaw = pratica.candidatoLuogoNascita ?? "";
  const commaParts = luogoNascitaRaw.split(",").map((p) => p.trim());
  const luogoDiNascita = commaParts[0] ?? "";

  // Checkbox tipo istanza
  const tipoIstanza = pratica.tipoIstanza ?? "";
  const foglioRosa = tipoIstanza === "esami";
  const duplicato = tipoIstanza === "conversione";
  const riclassificazione = tipoIstanza === "riclassificazione";

  return {
    cognome: pratica.candidatoCognome ?? "",
    nome: pratica.candidatoNome ?? "",
    sesso: pratica.candidatoSesso ?? "",
    dataNascita: formatDate(pratica.candidatoNascita),
    luogoDiNascita,
    provinciaNascita: "",
    stato: pratica.candidatoStatoNascita ?? "",
    cittadinanza: pratica.candidatoNazionalita ?? paeseCompleto,
    codiceFiscale: pratica.candidatoCodiceFiscale ?? "",
    luogoDiResidenza: pratica.residenzaComune ?? "",
    provinciaResidenza: pratica.residenzaProvincia ?? "",
    indirizzo: pratica.residenzaIndirizzo ?? "",
    numeroCivico: pratica.residenzaCivico ?? "",
    cap: pratica.residenzaCap ?? "",
    patentePosseduta,
    catPosseduta: pratica.categoriaPatente ?? "",
    catRichiesta: catItaliana,
    codiceAutoscuola: autoscuolaNome ?? "",
    data: formatDate(new Date().toISOString()),
    foglioRosa,
    duplicato,
    riclassificazione,
  };
}
