import { renderToBuffer } from "@react-pdf/renderer";
import { PraticaPDFDocument } from "./template";
import React from "react";

export interface PraticaPDFData {
  id: string;
  autoscuolaNome: string;
  stato: string;
  classificazione: string | null;
  classificazioneReasons: string[];
  documentiRichiesti: {
    doc_id: string;
    nome: string;
    obbligatorio: boolean;
    note?: string;
  }[];
  infoMancanti: string[];
  candidato: {
    nome: string | null;
    cognome: string | null;
    nascita: string | null;
  };
  patente: {
    paeseRilascio: string | null;
    paeseNome: string | null;
    categoria: string | null;
    dataRilascio: string | null;
    dataScadenza: string | null;
    valida: boolean | null;
  };
  residenza: {
    dataPrimaResidenza: string | null;
    tipoSoggiorno: string | null;
    scadenzaPermesso: string | null;
  };
  classificazioneVersione: string | null;
  classificazioneAt: Date | null;
  generatAt: Date;
}

export async function generatePraticaPDF(data: PraticaPDFData): Promise<Buffer> {
  // @react-pdf/renderer uses its own JSX runtime; cast is needed for TS compat
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(PraticaPDFDocument, { data }) as any;
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
