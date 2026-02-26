import { differenceInMonths, isAfter, isBefore, parseISO } from "date-fns";
import type {
  RulesEngineInput,
  RulesEngineOutput,
  NormativeDataset,
  NormativeCountry,
  NormativeAgreement,
  Classification,
  RequiredDocumentOutput,
} from "./types";

const DOCUMENT_NAMES_IT: Record<string, string> = {
  PATENTE_ORIGINALE: "Patente di guida originale",
  TRADUZIONE_ASSEVERATA: "Traduzione asseverata della patente",
  PASSAPORTO: "Passaporto in corso di validità",
  DOCUMENTO_IDENTITA: "Documento d'identità valido",
  CODICE_FISCALE: "Codice Fiscale",
  RESIDENZA: "Certificato di residenza",
  PERMESSO_SOGGIORNO: "Permesso di soggiorno o carta di soggiorno",
  MARCA_BOLLO: "Marca da bollo (€ 16,00)",
  FOTO_TESSERA: "Fotografie formato tessera (2)",
  MODULO_TT2112: "Modulo TT2112 (richiesta conversione)",
  CERT_AUTENTICITA: "Certificato di autenticità patente (consolato)",
  VISITA_MEDICA: "Certificato medico (visita CML)",
};

/**
 * Determinist rules engine for foreign driving licence conversion classification.
 * Pure function — no side effects, no DB access.
 * Given same input + dataset, always produces same output.
 */
export function evaluate(
  input: RulesEngineInput,
  dataset: NormativeDataset
): RulesEngineOutput {
  const evaluationDate = input.evaluation_date ?? new Date();
  const reasons: string[] = [];
  const missing: string[] = [];

  // ── 1. Critical missing information ─────────────────────────────────────────
  if (!input.country_of_issue) {
    missing.push("Paese di rilascio patente");
  }
  if (!input.license_category) {
    missing.push("Categoria patente");
  }

  if (missing.length > 0) {
    return buildOutput(
      "NEEDS_REVIEW",
      ["Informazioni critiche mancanti — impossibile classificare il caso"],
      resolveDocuments("no_agreement", null, null, dataset),
      missing,
      dataset.version,
      evaluationDate
    );
  }

  const countryIso = input.country_of_issue!.toUpperCase();
  const category = input.license_category!.toUpperCase();

  // ── 2. Find country in dataset ────────────────────────────────────────────
  const country = dataset.countries.find((c) => c.iso === countryIso);

  if (!country) {
    reasons.push(
      `Paese "${countryIso}" non trovato nel dataset normativo — richiede verifica manuale`
    );
    return buildOutput(
      "NEEDS_REVIEW",
      reasons,
      resolveDocuments("no_agreement", null, null, dataset),
      [`Il paese "${countryIso}" non è nel database: contattare il supporto per aggiornamento`],
      dataset.version,
      evaluationDate
    );
  }

  // ── 3. EU/EEA branch ─────────────────────────────────────────────────────
  if (country.is_eu_eea) {
    return evaluateEuEea(
      input,
      country,
      category,
      dataset,
      evaluationDate,
      reasons,
      missing
    );
  }

  // ── 4. Bilateral agreement branch ─────────────────────────────────────────
  if (country.has_agreement && country.agreement_id) {
    const agreement = dataset.agreements.find(
      (a) => a.id === country.agreement_id
    );
    if (agreement) {
      return evaluateBilateral(
        input,
        country,
        agreement,
        category,
        dataset,
        evaluationDate,
        reasons,
        missing
      );
    }
  }

  // ── 5. No agreement ──────────────────────────────────────────────────────
  reasons.push(
    `Nessun accordo bilaterale tra Italia e ${country.name_it} (art. 136-bis C.d.S.)`
  );
  reasons.push(
    "Per la conversione è necessario sostenere l'esame teorico e pratico"
  );

  return buildOutput(
    "NOT_CONVERTIBLE_EXAMS",
    reasons,
    resolveDocuments("no_agreement", countryIso, category, dataset),
    missing,
    dataset.version,
    evaluationDate
  );
}

// ─── EU/EEA EVALUATION ────────────────────────────────────────────────────────

function evaluateEuEea(
  input: RulesEngineInput,
  country: NormativeCountry,
  category: string,
  dataset: NormativeDataset,
  evaluationDate: Date,
  reasons: string[],
  missing: string[]
): RulesEngineOutput {
  reasons.push(
    `${country.name_it} è un paese UE/SEE: conversione diretta (art. 135 C.d.S.)`
  );

  // Check licence validity
  const validityCheck = checkLicenceValidity(
    input,
    evaluationDate,
    true // isEuEea
  );

  if (validityCheck.status === "expired_too_long") {
    reasons.push(validityCheck.reason!);
    return buildOutput(
      "NOT_CONVERTIBLE_EXAMS",
      reasons,
      resolveDocuments("eu_eea", country.iso, category, dataset),
      missing,
      dataset.version,
      evaluationDate
    );
  }

  if (validityCheck.status === "unknown") {
    missing.push("Validità e data scadenza patente");
    reasons.push(
      "Validità patente non confermata — verifica necessaria"
    );
    return buildOutput(
      "NEEDS_REVIEW",
      reasons,
      resolveDocuments("eu_eea", country.iso, category, dataset),
      missing,
      dataset.version,
      evaluationDate
    );
  }

  if (validityCheck.status === "expired_within_3_years") {
    reasons.push(validityCheck.reason!);
    // Still convertible but with note
  }

  // Check special categories
  const catNotes = getCategoryNotes(category);
  if (catNotes) reasons.push(catNotes);

  return buildOutput(
    "LIKELY_CONVERTIBLE",
    reasons,
    resolveDocuments("eu_eea", country.iso, category, dataset),
    missing,
    dataset.version,
    evaluationDate
  );
}

// ─── BILATERAL AGREEMENT EVALUATION ──────────────────────────────────────────

function evaluateBilateral(
  input: RulesEngineInput,
  country: NormativeCountry,
  agreement: NormativeAgreement,
  category: string,
  dataset: NormativeDataset,
  evaluationDate: Date,
  reasons: string[],
  missing: string[]
): RulesEngineOutput {
  // Check agreement is currently active
  if (!agreement.active) {
    reasons.push(
      `L'accordo bilaterale con ${country.name_it} non è attivo`
    );
    reasons.push("Necessario esame teorico e pratico");
    return buildOutput(
      "NOT_CONVERTIBLE_EXAMS",
      reasons,
      resolveDocuments("no_agreement", country.iso, category, dataset),
      missing,
      dataset.version,
      evaluationDate
    );
  }

  // Check agreement date validity
  if (agreement.effective_date) {
    const effectiveDate = parseISO(agreement.effective_date);
    if (isBefore(evaluationDate, effectiveDate)) {
      reasons.push(
        `L'accordo bilaterale con ${country.name_it} non è ancora in vigore (inizia il ${agreement.effective_date})`
      );
      return buildOutput(
        "NEEDS_REVIEW",
        reasons,
        resolveDocuments("no_agreement", country.iso, category, dataset),
        missing,
        dataset.version,
        evaluationDate
      );
    }
  }

  if (agreement.expiry_date) {
    const expiryDate = parseISO(agreement.expiry_date);
    if (isAfter(evaluationDate, expiryDate)) {
      reasons.push(
        `L'accordo bilaterale con ${country.name_it} è scaduto il ${agreement.expiry_date}`
      );
      reasons.push("Necessario esame teorico e pratico");
      return buildOutput(
        "NOT_CONVERTIBLE_EXAMS",
        reasons,
        resolveDocuments("no_agreement", country.iso, category, dataset),
        missing,
        dataset.version,
        evaluationDate
      );
    }
  }

  reasons.push(`Accordo bilaterale attivo tra Italia e ${country.name_it}`);

  // Check category coverage
  if (agreement.categories.length > 0) {
    const normalizedCategory = normalizeCategory(category);
    const covered = agreement.categories.some(
      (c) => c.toUpperCase() === normalizedCategory
    );
    if (!covered) {
      reasons.push(
        `La categoria ${category} non è coperta dall'accordo bilaterale con ${country.name_it}`
      );
      reasons.push(
        `Categorie coperte dall'accordo: ${agreement.categories.join(", ")}`
      );
      reasons.push("Necessario esame teorico e pratico per questa categoria");
      return buildOutput(
        "NOT_CONVERTIBLE_EXAMS",
        reasons,
        resolveDocuments("no_agreement", country.iso, category, dataset),
        missing,
        dataset.version,
        evaluationDate
      );
    }
    reasons.push(`Categoria ${category} coperta dall'accordo`);
  }

  // Check temporal condition
  if (agreement.temporal_condition === "rilascio_ante_residenza") {
    if (!input.italy_residency_date) {
      missing.push(
        "Data prima residenza in Italia (necessaria per verificare condizione temporale dell'accordo)"
      );
    } else if (!input.license_issue_date) {
      missing.push(
        "Data rilascio patente (necessaria per verificare condizione temporale dell'accordo)"
      );
    } else {
      if (!isBefore(input.license_issue_date, input.italy_residency_date)) {
        reasons.push(
          `La patente è stata rilasciata il ${formatDate(input.license_issue_date)}, dopo la residenza in Italia (${formatDate(input.italy_residency_date)})`
        );
        reasons.push(
          `L'accordo con ${country.name_it} richiede che la patente sia stata rilasciata PRIMA della residenza in Italia`
        );
        reasons.push("Necessario esame teorico e pratico");
        return buildOutput(
          "NOT_CONVERTIBLE_EXAMS",
          reasons,
          resolveDocuments("no_agreement", country.iso, category, dataset),
          missing,
          dataset.version,
          evaluationDate
        );
      }
      reasons.push(
        `Patente rilasciata il ${formatDate(input.license_issue_date)}, prima della residenza italiana (${formatDate(input.italy_residency_date)}) ✓`
      );
    }
  } else if (
    agreement.temporal_condition === "entro_anni_residenza" &&
    agreement.years_from_residency
  ) {
    if (!input.italy_residency_date) {
      missing.push("Data prima residenza in Italia");
    } else if (!input.license_issue_date) {
      missing.push("Data rilascio patente");
    } else {
      const deadline = new Date(input.italy_residency_date);
      deadline.setFullYear(
        deadline.getFullYear() + agreement.years_from_residency
      );
      if (isAfter(input.license_issue_date, deadline)) {
        reasons.push(
          `La patente è stata rilasciata oltre ${agreement.years_from_residency} anni dalla residenza in Italia`
        );
        reasons.push("Necessario esame teorico e pratico");
        return buildOutput(
          "NOT_CONVERTIBLE_EXAMS",
          reasons,
          resolveDocuments("no_agreement", country.iso, category, dataset),
          missing,
          dataset.version,
          evaluationDate
        );
      }
      reasons.push(
        `Patente rilasciata entro ${agreement.years_from_residency} anni dalla residenza italiana ✓`
      );
    }
  }

  // Check licence validity (extra-UE is stricter)
  const validityCheck = checkLicenceValidity(input, evaluationDate, false);
  if (
    validityCheck.status === "expired" ||
    validityCheck.status === "expired_too_long"
  ) {
    reasons.push("Patente scaduta: richiede verifica manuale per extra-UE");
    missing.push("Verifica validità patente scaduta con la Motorizzazione competente");
    return buildOutput(
      "NEEDS_REVIEW",
      reasons,
      resolveDocuments("bilateral_agreement", country.iso, category, dataset),
      missing,
      dataset.version,
      evaluationDate
    );
  }

  if (validityCheck.status === "unknown") {
    missing.push("Validità e data scadenza patente");
  }

  // Check permesso di soggiorno
  if (!input.permit_type) {
    missing.push("Tipo documento di soggiorno");
  } else if (
    input.permit_type === "permesso_soggiorno" &&
    input.permit_expiry_date
  ) {
    if (isBefore(input.permit_expiry_date, evaluationDate)) {
      reasons.push(
        `Il permesso di soggiorno è scaduto il ${formatDate(input.permit_expiry_date)}`
      );
      missing.push("Rinnovo permesso di soggiorno");
      return buildOutput(
        "NEEDS_REVIEW",
        reasons,
        resolveDocuments("bilateral_agreement", country.iso, category, dataset),
        missing,
        dataset.version,
        evaluationDate
      );
    }
    reasons.push(
      `Permesso di soggiorno valido fino al ${formatDate(input.permit_expiry_date)} ✓`
    );
  }

  // Special categories note
  const catNotes = getCategoryNotes(category);
  if (catNotes) reasons.push(catNotes);

  // If there are missing infos but no blocking issues → NEEDS_REVIEW
  if (missing.length > 0) {
    return buildOutput(
      "NEEDS_REVIEW",
      reasons,
      resolveDocuments("bilateral_agreement", country.iso, category, dataset),
      missing,
      dataset.version,
      evaluationDate
    );
  }

  return buildOutput(
    "LIKELY_CONVERTIBLE",
    reasons,
    resolveDocuments("bilateral_agreement", country.iso, category, dataset),
    missing,
    dataset.version,
    evaluationDate
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

type ValidityStatus =
  | "valid"
  | "expired_within_3_years"
  | "expired"
  | "expired_too_long"
  | "unknown";

function checkLicenceValidity(
  input: RulesEngineInput,
  evaluationDate: Date,
  isEuEea: boolean
): { status: ValidityStatus; reason?: string } {
  // If explicitly marked invalid/expired
  if (input.license_valid === false) {
    if (input.license_expiry_date) {
      const monthsExpired = differenceInMonths(
        evaluationDate,
        input.license_expiry_date
      );
      if (isEuEea && monthsExpired <= 36) {
        return {
          status: "expired_within_3_years",
          reason: `Patente UE scaduta da ${monthsExpired} mesi — può essere convertita entro 3 anni dalla scadenza (potrebbe richiedere visita medica)`,
        };
      } else if (isEuEea && monthsExpired > 36) {
        return {
          status: "expired_too_long",
          reason: `Patente UE scaduta da più di 3 anni — non convertibile direttamente`,
        };
      }
      return {
        status: "expired",
        reason: `Patente scaduta il ${formatDate(input.license_expiry_date)}`,
      };
    }
    return { status: "expired", reason: "Patente dichiarata non valida/scaduta" };
  }

  // If valid flag is true
  if (input.license_valid === true) {
    return { status: "valid" };
  }

  // Derive from expiry date if available
  if (input.license_expiry_date) {
    if (isAfter(evaluationDate, input.license_expiry_date)) {
      const monthsExpired = differenceInMonths(
        evaluationDate,
        input.license_expiry_date
      );
      if (isEuEea && monthsExpired <= 36) {
        return {
          status: "expired_within_3_years",
          reason: `Patente UE scaduta da ${monthsExpired} mesi — può essere convertita entro 3 anni dalla scadenza`,
        };
      }
      return {
        status: isEuEea && monthsExpired > 36 ? "expired_too_long" : "expired",
        reason: `Patente scaduta il ${formatDate(input.license_expiry_date)}`,
      };
    }
    return { status: "valid" };
  }

  return { status: "unknown" };
}

function resolveDocuments(
  zone: string,
  countryIso: string | null,
  category: string | null,
  dataset: NormativeDataset
): RequiredDocumentOutput[] {
  const docs: Map<string, RequiredDocumentOutput> = new Map();

  // Find zone-level requirements
  const zoneReq = dataset.requirements.find(
    (r) => r.zone === zone && r.country_iso === null && r.category === null
  );
  if (zoneReq) {
    for (const d of zoneReq.required_docs) {
      docs.set(d.code, {
        doc_id: d.code,
        nome: DOCUMENT_NAMES_IT[d.code] ?? d.code,
        obbligatorio: d.mandatory,
        note: d.conditional ?? undefined,
      });
    }
  }

  // Find country-specific overrides
  if (countryIso) {
    const countryReq = dataset.requirements.find(
      (r) => r.country_iso === countryIso && r.category === null
    );
    if (countryReq) {
      for (const d of countryReq.required_docs) {
        docs.set(d.code, {
          doc_id: d.code,
          nome: DOCUMENT_NAMES_IT[d.code] ?? d.code,
          obbligatorio: d.mandatory,
          note: d.conditional ?? undefined,
        });
      }
    }
  }

  // Find category-specific additions
  if (category) {
    const catReq = dataset.requirements.find(
      (r) => r.category === category && r.zone === null
    );
    if (catReq) {
      for (const d of catReq.required_docs) {
        docs.set(d.code, {
          doc_id: d.code,
          nome: DOCUMENT_NAMES_IT[d.code] ?? d.code,
          obbligatorio: d.mandatory,
          note: d.conditional ?? undefined,
        });
      }
    }
  }

  return Array.from(docs.values());
}

function normalizeCategory(category: string): string {
  return category.toUpperCase().replace(/\s+/g, "");
}

function getCategoryNotes(category: string): string | null {
  const upper = category.toUpperCase();
  if (upper === "C" || upper === "C1" || upper === "CE") {
    return "Categoria C: richiede certificato medico (visita CML) e attestato professionale";
  }
  if (upper === "D" || upper === "D1" || upper === "DE") {
    return "Categoria D: richiede certificato medico (visita CML) e attestato professionale";
  }
  return null;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildOutput(
  classification: Classification,
  reasons: string[],
  required_documents: RequiredDocumentOutput[],
  missing_information: string[],
  dataset_version: string,
  evaluated_at: Date
): RulesEngineOutput {
  return {
    classification,
    reasons,
    required_documents,
    missing_information,
    dataset_version,
    evaluated_at,
  };
}
