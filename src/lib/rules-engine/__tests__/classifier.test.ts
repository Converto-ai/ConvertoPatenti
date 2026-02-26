import { describe, it, expect } from "vitest";
import { evaluate } from "../classifier";
import type { NormativeDataset, RulesEngineInput } from "../types";

// ─── Fixture dataset ─────────────────────────────────────────────────────────

const DATASET: NormativeDataset = {
  version: "test-2024",
  countries: [
    { iso: "DE", name_it: "Germania", zone: "eu_eea", is_eu_eea: true, has_agreement: false, name_en: "Germany" },
    { iso: "FR", name_it: "Francia", zone: "eu_eea", is_eu_eea: true, has_agreement: false, name_en: "France" },
    { iso: "MA", name_it: "Marocco", zone: "bilateral_agreement", is_eu_eea: false, has_agreement: true, agreement_id: "MA-TEST", name_en: "Morocco" },
    { iso: "TN", name_it: "Tunisia", zone: "bilateral_agreement", is_eu_eea: false, has_agreement: true, agreement_id: "TN-TEST", name_en: "Tunisia" },
    { iso: "GE", name_it: "Georgia", zone: "bilateral_agreement", is_eu_eea: false, has_agreement: true, agreement_id: "GE-TEST", name_en: "Georgia" },
    { iso: "BR", name_it: "Brasile", zone: "no_agreement", is_eu_eea: false, has_agreement: false, name_en: "Brazil" },
    { iso: "IN", name_it: "India", zone: "no_agreement", is_eu_eea: false, has_agreement: false, name_en: "India" },
    { iso: "GB", name_it: "Regno Unito", zone: "bilateral_agreement", is_eu_eea: false, has_agreement: true, agreement_id: "GB-TEST-EXPIRED", name_en: "United Kingdom" },
    { iso: "AL", name_it: "Albania", zone: "bilateral_agreement", is_eu_eea: false, has_agreement: true, agreement_id: "AL-TEST", name_en: "Albania" },
  ],
  agreements: [
    {
      id: "MA-TEST",
      country_iso: "MA",
      active: true,
      effective_date: "1996-01-01",
      expiry_date: null,
      categories: ["B"],
      temporal_condition: "rilascio_ante_residenza",
      years_from_residency: null,
      requires_theory_exam: false,
      requires_practical_exam: false,
    },
    {
      id: "TN-TEST",
      country_iso: "TN",
      active: true,
      effective_date: null,
      expiry_date: null,
      categories: ["B"],
      temporal_condition: "rilascio_ante_residenza",
      years_from_residency: null,
      requires_theory_exam: false,
      requires_practical_exam: false,
    },
    {
      id: "GE-TEST",
      country_iso: "GE",
      active: true,
      effective_date: null,
      expiry_date: null,
      categories: ["B"],
      temporal_condition: "rilascio_ante_residenza",
      years_from_residency: null,
      requires_theory_exam: false,
      requires_practical_exam: false,
    },
    {
      id: "GB-TEST-EXPIRED",
      country_iso: "GB",
      active: true,
      effective_date: "2021-01-01",
      expiry_date: "2023-12-31", // scaduto
      categories: ["B"],
      temporal_condition: "nessuna",
      years_from_residency: null,
      requires_theory_exam: false,
      requires_practical_exam: false,
    },
    {
      id: "AL-TEST",
      country_iso: "AL",
      active: true,
      effective_date: null,
      expiry_date: null,
      categories: ["B"],
      temporal_condition: "nessuna",
      years_from_residency: null,
      requires_theory_exam: false,
      requires_practical_exam: false,
    },
  ],
  requirements: [
    {
      zone: "eu_eea",
      country_iso: null,
      category: null,
      required_docs: [
        { code: "PATENTE_ORIGINALE", mandatory: true, conditional: null, order: 1 },
        { code: "DOCUMENTO_IDENTITA", mandatory: true, conditional: null, order: 2 },
        { code: "RESIDENZA", mandatory: true, conditional: null, order: 3 },
        { code: "MODULO_TT2112", mandatory: true, conditional: null, order: 4 },
      ],
    },
    {
      zone: "bilateral_agreement",
      country_iso: null,
      category: null,
      required_docs: [
        { code: "PATENTE_ORIGINALE", mandatory: true, conditional: null, order: 1 },
        { code: "TRADUZIONE_ASSEVERATA", mandatory: true, conditional: null, order: 2 },
        { code: "PASSAPORTO", mandatory: true, conditional: null, order: 3 },
        { code: "PERMESSO_SOGGIORNO", mandatory: true, conditional: null, order: 4 },
        { code: "MODULO_TT2112", mandatory: true, conditional: null, order: 5 },
      ],
    },
    {
      zone: "no_agreement",
      country_iso: null,
      category: null,
      required_docs: [
        { code: "DOCUMENTO_IDENTITA", mandatory: true, conditional: null, order: 1 },
      ],
    },
    {
      zone: null,
      country_iso: null,
      category: "C",
      required_docs: [
        { code: "VISITA_MEDICA", mandatory: true, conditional: "Obbligatorio per categoria C", order: 99 },
      ],
    },
  ],
};

const EVAL_DATE = new Date("2024-06-01");

function input(overrides: Partial<RulesEngineInput>): RulesEngineInput {
  return {
    country_of_issue: null,
    license_category: "B",
    license_issue_date: null,
    license_expiry_date: null,
    license_valid: true,
    italy_residency_date: null,
    permit_type: null,
    permit_expiry_date: null,
    evaluation_date: EVAL_DATE,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Rules Engine — EU/EEA", () => {
  it("T01: German citizen with valid B licence → LIKELY_CONVERTIBLE", () => {
    const result = evaluate(
      input({ country_of_issue: "DE", license_valid: true }),
      DATASET
    );
    expect(result.classification).toBe("LIKELY_CONVERTIBLE");
    expect(result.reasons.some((r) => r.includes("art. 135"))).toBe(true);
  });

  it("T07: French licence expired 18 months ago → LIKELY_CONVERTIBLE with note", () => {
    const expiryDate = new Date("2023-01-01"); // ~17 months before EVAL_DATE
    const result = evaluate(
      input({
        country_of_issue: "FR",
        license_valid: false,
        license_expiry_date: expiryDate,
      }),
      DATASET
    );
    expect(result.classification).toBe("LIKELY_CONVERTIBLE");
    expect(result.reasons.some((r) => r.includes("scaduta"))).toBe(true);
  });

  it("EU licence expired more than 3 years ago → NOT_CONVERTIBLE_EXAMS", () => {
    const expiryDate = new Date("2020-01-01"); // >4 years before EVAL_DATE
    const result = evaluate(
      input({
        country_of_issue: "DE",
        license_valid: false,
        license_expiry_date: expiryDate,
      }),
      DATASET
    );
    expect(result.classification).toBe("NOT_CONVERTIBLE_EXAMS");
  });
});

describe("Rules Engine — Bilateral agreements", () => {
  it("T02: Moroccan, agreement active, licence issued before residency → LIKELY_CONVERTIBLE", () => {
    const result = evaluate(
      input({
        country_of_issue: "MA",
        license_issue_date: new Date("2015-06-01"),
        italy_residency_date: new Date("2019-01-01"),
        license_valid: true,
        permit_type: "permesso_soggiorno",
        permit_expiry_date: new Date("2025-12-01"),
      }),
      DATASET
    );
    expect(result.classification).toBe("LIKELY_CONVERTIBLE");
  });

  it("Moroccan, licence issued AFTER residency → NOT_CONVERTIBLE_EXAMS", () => {
    const result = evaluate(
      input({
        country_of_issue: "MA",
        license_issue_date: new Date("2021-01-01"), // after residency
        italy_residency_date: new Date("2019-01-01"),
        license_valid: true,
        permit_type: "permesso_soggiorno",
        permit_expiry_date: new Date("2025-12-01"),
      }),
      DATASET
    );
    expect(result.classification).toBe("NOT_CONVERTIBLE_EXAMS");
    expect(result.reasons.some((r) => r.includes("rilasciata"))).toBe(true);
  });

  it("T06: Category C not covered by agreement → NOT_CONVERTIBLE_EXAMS", () => {
    const result = evaluate(
      input({
        country_of_issue: "MA",
        license_category: "C",
        license_issue_date: new Date("2015-01-01"),
        italy_residency_date: new Date("2019-01-01"),
        license_valid: true,
        permit_type: "permesso_soggiorno",
        permit_expiry_date: new Date("2025-12-01"),
      }),
      DATASET
    );
    expect(result.classification).toBe("NOT_CONVERTIBLE_EXAMS");
    expect(result.reasons.some((r) => r.includes("non è coperta"))).toBe(true);
  });

  it("T05: Bilateral agreement expired (GB post-Brexit scenario) → NOT_CONVERTIBLE_EXAMS", () => {
    const result = evaluate(
      input({
        country_of_issue: "GB",
        license_valid: true,
        permit_type: "permesso_soggiorno",
        permit_expiry_date: new Date("2025-12-01"),
      }),
      DATASET
    );
    expect(result.classification).toBe("NOT_CONVERTIBLE_EXAMS");
    expect(result.reasons.some((r) => r.includes("scaduto"))).toBe(true);
  });

  it("T09: Expired permesso di soggiorno → NEEDS_REVIEW", () => {
    const result = evaluate(
      input({
        country_of_issue: "AL",
        license_valid: true,
        permit_type: "permesso_soggiorno",
        permit_expiry_date: new Date("2023-01-01"), // scaduto
      }),
      DATASET
    );
    expect(result.classification).toBe("NEEDS_REVIEW");
    expect(result.reasons.some((r) => r.includes("scaduto"))).toBe(true);
  });

  it("T08: Extra-UE expired licence → NEEDS_REVIEW", () => {
    const result = evaluate(
      input({
        country_of_issue: "MA",
        license_valid: false,
        license_expiry_date: new Date("2023-01-01"),
        license_issue_date: new Date("2015-01-01"),
        italy_residency_date: new Date("2019-01-01"),
        permit_type: "permesso_soggiorno",
        permit_expiry_date: new Date("2025-12-01"),
      }),
      DATASET
    );
    expect(result.classification).toBe("NEEDS_REVIEW");
  });
});

describe("Rules Engine — No agreement", () => {
  it("T03: Brazilian, no agreement → NOT_CONVERTIBLE_EXAMS", () => {
    const result = evaluate(
      input({ country_of_issue: "BR", license_valid: true }),
      DATASET
    );
    expect(result.classification).toBe("NOT_CONVERTIBLE_EXAMS");
    expect(result.reasons.some((r) => r.includes("Nessun accordo"))).toBe(true);
  });

  it("Indian, no agreement → NOT_CONVERTIBLE_EXAMS", () => {
    const result = evaluate(
      input({ country_of_issue: "IN", license_valid: true }),
      DATASET
    );
    expect(result.classification).toBe("NOT_CONVERTIBLE_EXAMS");
  });
});

describe("Rules Engine — Missing information", () => {
  it("T04: Missing country → NEEDS_REVIEW", () => {
    const result = evaluate(
      input({ country_of_issue: null }),
      DATASET
    );
    expect(result.classification).toBe("NEEDS_REVIEW");
    expect(result.missing_information.some((m) => m.includes("Paese"))).toBe(true);
  });

  it("Missing category → NEEDS_REVIEW", () => {
    const result = evaluate(
      input({ country_of_issue: "DE", license_category: null }),
      DATASET
    );
    expect(result.classification).toBe("NEEDS_REVIEW");
    expect(result.missing_information.some((m) => m.includes("Categoria"))).toBe(true);
  });

  it("Unknown country → NEEDS_REVIEW", () => {
    const result = evaluate(
      input({ country_of_issue: "ZZ" }), // not in dataset
      DATASET
    );
    expect(result.classification).toBe("NEEDS_REVIEW");
  });

  it("MA without residency date → NEEDS_REVIEW", () => {
    const result = evaluate(
      input({
        country_of_issue: "MA",
        license_issue_date: new Date("2015-01-01"),
        italy_residency_date: null, // missing
        license_valid: true,
        permit_type: "permesso_soggiorno",
        permit_expiry_date: new Date("2025-12-01"),
      }),
      DATASET
    );
    expect(result.classification).toBe("NEEDS_REVIEW");
    expect(result.missing_information.some((m) => m.includes("residenza"))).toBe(true);
  });
});

describe("Rules Engine — Documents", () => {
  it("EU case returns EU documents", () => {
    const result = evaluate(
      input({ country_of_issue: "DE", license_valid: true }),
      DATASET
    );
    const codes = result.required_documents.map((d) => d.doc_id);
    expect(codes).toContain("PATENTE_ORIGINALE");
    expect(codes).toContain("MODULO_TT2112");
    expect(codes).not.toContain("TRADUZIONE_ASSEVERATA");
  });

  it("Bilateral agreement case returns bilateral documents", () => {
    const result = evaluate(
      input({
        country_of_issue: "AL",
        license_valid: true,
        permit_type: "permesso_soggiorno",
        permit_expiry_date: new Date("2025-12-01"),
      }),
      DATASET
    );
    const codes = result.required_documents.map((d) => d.doc_id);
    expect(codes).toContain("TRADUZIONE_ASSEVERATA");
    expect(codes).toContain("PERMESSO_SOGGIORNO");
    expect(codes).toContain("PASSAPORTO");
  });

  it("Category C adds medical certificate", () => {
    const result = evaluate(
      input({ country_of_issue: "DE", license_category: "C", license_valid: true }),
      DATASET
    );
    const codes = result.required_documents.map((d) => d.doc_id);
    expect(codes).toContain("VISITA_MEDICA");
  });
});

describe("Rules Engine — Dataset version", () => {
  it("Output includes dataset version", () => {
    const result = evaluate(
      input({ country_of_issue: "DE", license_valid: true }),
      DATASET
    );
    expect(result.dataset_version).toBe("test-2024");
  });
});
