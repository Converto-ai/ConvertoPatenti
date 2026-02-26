export type Classification =
  | "LIKELY_CONVERTIBLE"
  | "NOT_CONVERTIBLE_EXAMS"
  | "NEEDS_REVIEW";

export type TemporalCondition =
  | "rilascio_ante_residenza"
  | "entro_anni_residenza"
  | "nessuna";

export interface NormativeCountry {
  iso: string;
  name_it: string;
  name_en: string;
  zone: "eu_eea" | "bilateral_agreement" | "no_agreement";
  is_eu_eea: boolean;
  has_agreement: boolean;
  agreement_id?: string;
}

export interface NormativeAgreement {
  id: string;
  country_iso: string;
  active: boolean;
  effective_date: string | null;
  expiry_date: string | null;
  categories: string[];
  temporal_condition: TemporalCondition | null;
  years_from_residency: number | null;
  requires_theory_exam: boolean;
  requires_practical_exam: boolean;
}

export interface DocumentRequirement {
  code: string;
  mandatory: boolean;
  conditional: string | null;
  order: number;
}

export interface NormativeRequirement {
  zone: string | null;
  country_iso: string | null;
  category: string | null;
  required_docs: DocumentRequirement[];
}

export interface NormativeDataset {
  version: string;
  countries: NormativeCountry[];
  agreements: NormativeAgreement[];
  requirements: NormativeRequirement[];
}

export interface RulesEngineInput {
  country_of_issue: string | null;
  license_category: string | null;
  license_issue_date: Date | null;
  license_expiry_date: Date | null;
  license_valid: boolean | null;
  italy_residency_date: Date | null;
  permit_type:
    | "cittadino_eu"
    | "permesso_soggiorno"
    | "carta_soggiorno"
    | null;
  permit_expiry_date: Date | null;
  evaluation_date?: Date;
}

export interface RequiredDocumentOutput {
  doc_id: string;
  nome: string;
  obbligatorio: boolean;
  note?: string;
}

export interface RulesEngineOutput {
  classification: Classification;
  reasons: string[];
  required_documents: RequiredDocumentOutput[];
  missing_information: string[];
  dataset_version: string;
  evaluated_at: Date;
}
