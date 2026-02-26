import { PDFDocument } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import type { TT2112Data } from "./tt2112-mapping";

const TT2112_PATH = path.join(
  process.cwd(),
  "data/sources/tt2112/tt2112-editabile.pdf"
);

/**
 * Riempie i form fields del TT2112 originale con i dati forniti.
 * Restituisce il PDF come Buffer.
 */
export async function fillTT2112(data: TT2112Data): Promise<Buffer> {
  const templateBytes = fs.readFileSync(TT2112_PATH);
  const pdf = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdf.getForm();

  const setField = (name: string, value: string | undefined) => {
    if (!value) return;
    try {
      const field = form.getTextField(name);
      field.setText(value);
    } catch {
      // Campo non trovato — ignora silenziosamente
    }
  };

  const setCheck = (name: string, value: boolean | undefined) => {
    if (!value) return;
    try {
      const field = form.getCheckBox(name);
      if (value) field.check();
    } catch {
      // Ignora
    }
  };

  // Dati anagrafici
  setField("Cognome", data.cognome);
  setField("Nome", data.nome);
  setField("Sesso", data.sesso);
  setField("Luogo di nascita", data.luogoDiNascita);
  setField("Provincia_nascita", data.provinciaNascita);
  setField("Stato", data.stato);
  setField("Data Nascita", data.dataNascita);
  setField("Cittadinanza", data.cittadinanza);
  setField("Codice fiscale", data.codiceFiscale);
  // Il campo barcode usa un font speciale: lasciamo vuoto per evitare caratteri illeggibili

  // Residenza
  setField("Luogo di residenza", data.luogoDiResidenza);
  setField("Provincia_residenza", data.provinciaResidenza);
  setField("Indirizzo", data.indirizzo);
  setField("Numero Civico", data.numeroCivico);
  setField("CAP", data.cap);

  // Patente
  setField("Patente Posseduta", data.patentePosseduta);
  // Barcode patente: lasciato vuoto (richiede font speciale non disponibile)
  setField("Cat. posseduta", data.catPosseduta);
  setField("Cat. posseduta_1", data.catPosseduta1);
  setField("Cat. posseduta_2", data.catPosseduta2);
  setField("Cat. richiesta", data.catRichiesta);
  setField("Cat. richiesta_1", data.catRichiesta1);
  setField("Cat. richiesta_2", data.catRichiesta2);
  setField("Prescrizioni", data.prescrizioni);

  // Autoscuola / UMC
  setField("Codice Autoscuola / Agenzia", data.codiceAutoscuola);
  setField("UMC", data.umc);

  // Data compilazione
  setField("Data", data.data);

  // Checkboxes
  setCheck("Foglio Rosa", data.foglioRosa);
  setCheck("Duplicato", data.duplicato);
  setCheck("Riclassificazione", data.riclassificazione);

  // Flatten form (opzionale: rende il PDF non più editabile ma più compatibile)
  form.flatten();

  const pdfBytes = await pdf.save();
  return Buffer.from(pdfBytes);
}
