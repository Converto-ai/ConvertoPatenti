import { evaluate } from "./classifier";
import type {
  RulesEngineInput,
  RulesEngineOutput,
  NormativeDataset,
} from "./types";
import countriesData from "@/data/countries.json";
import agreementsData from "@/data/agreements.json";
import documentsConfig from "@/data/documents-config.json";

export { evaluate } from "./classifier";
export type * from "./types";

/**
 * Load the normative dataset from bundled JSON files.
 * In production, this could be loaded from DB for real-time updates.
 */
export function loadDataset(): NormativeDataset {
  return {
    version: countriesData.version,
    countries: countriesData.countries as NormativeDataset["countries"],
    agreements: agreementsData.agreements as NormativeDataset["agreements"],
    requirements:
      documentsConfig.requirements as NormativeDataset["requirements"],
  };
}

/**
 * Convenience function: evaluate with bundled dataset.
 */
export function evaluateWithDataset(
  input: RulesEngineInput
): RulesEngineOutput {
  const dataset = loadDataset();
  return evaluate(input, dataset);
}
