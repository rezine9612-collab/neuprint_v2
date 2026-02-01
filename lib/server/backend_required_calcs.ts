// lib/server/backend_required_calcs.ts
//
// NOTE
// This project intentionally separates:
// - GPT extraction (gpt_raw)
// - backend calculations (backend_required_calcs)
//
// At the moment, the Excel workbook driving many backend calculations is not
// fully translated into code. However, derive.ts imports this module and the
// build must succeed.
//
// STRICT POLICY
// - Do NOT invent formulas.
// - Do NOT apply proxy/fallback substitutions.
// - Record missing specs as UnknownCalc so the user can fill them later.

import type { ReportJson } from "./schema";

// Keep these small and stable: derive.ts expects these names.
export type NeuPrintReport = ReportJson;

export type UnknownCalc = {
  json_path: string;
  reason: string;
  needed_inputs: string[];
};

// Optional future inputs for calculation (percentiles, cohort stats, etc.)
export type ComputeInputs = {
  // reserved for future: cohort distributions, norms, versioning, etc.
  [k: string]: unknown;
};

export function computeBackendRequiredCalcs(
  report: NeuPrintReport,
  _inputs: ComputeInputs = {},
): { report: NeuPrintReport; unknown: UnknownCalc[] } {
  // We deliberately do not compute anything here until formulas are confirmed.
  // Instead, record the major Excel-driven areas as pending.

  const unknown: UnknownCalc[] = [];

  // RSL aggregates / cohort / labels are typically Excel-driven.
  unknown.push({
    json_path: "backend.rsl",
    reason:
      "RSL backend_required_calcs are not implemented in code yet. Provide confirmed formulas (Excel) to compute RSL aggregates/levels/cohort comparisons.",
    needed_inputs: [
      "gpt_raw.raw_features",
      "backend.rsl.* (targets)",
      "catalog.* (if mapping required)",
    ],
  });

  // Control distribution computations (if any beyond reliability) can be Excel-driven.
  unknown.push({
    json_path: "backend.control",
    reason:
      "Control distribution / pattern classification formulas are not implemented in code yet (Excel-driven).",
    needed_inputs: [
      "backend.cff.indicator_scores.*",
      "backend.rsl.*",
      "catalog.control_patterns (if used)",
    ],
  });

  // Role-fit mapping / distance scoring depends on catalog + formula choice.
  unknown.push({
    json_path: "backend.role_fit",
    reason:
      "Role-fit scoring and Top-N selection are not implemented in code yet. Provide finalized distance/normalization formulas and job catalog mapping.",
    needed_inputs: [
      "backend.cff.indicator_scores.*",
      "backend.rsl.*",
      "catalog.role_fit_* (job groups/jobs)",
    ],
  });

  return { report, unknown };
}
