// lib/server/derive.ts
//
// STRICT DERIVATION POLICY (user-confirmed):
// 1) Do NOT compute anything without an explicit, agreed formula/spec.
// 2) Do NOT use fallbacks, proxies, or default substitutions when required inputs are missing.
// 3) If an input or formula is missing, record it as UnknownCalc so the user can provide the rule later.
//
// This module:
// - Computes ONLY what is fixed by the provided formula files:
//   - cff계산식.txt  (CFF6: AAS, CTF, RMD, RDX, EDS, IFD)
//   - Reliability band 계산식.txt (reliability_score + band from CFF6)
// - Delegates the rest to backend_required_calcs.ts, which already returns its own unknown list.

import {
  computeBackendRequiredCalcs,
  type ComputeInputs,
  type NeuPrintReport,
  type UnknownCalc,
} from "./backend_required_calcs";

export type BandHML = "HIGH" | "MEDIUM" | "LOW";

export type KnownCalc = {
  name: string;
  writes: string[];
  spec_source: string;
  uses: string[];
};

export type DeriveSummary = {
  known_calcs: KnownCalc[];
  unknown_calcs: UnknownCalc[];
  notes: string[];
};

// ------------------------------
// Helpers
// ------------------------------

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function safeDiv(a: number, b: number): number {
  const aa = Number.isFinite(a) ? a : 0;
  const bb = Number.isFinite(b) ? b : 0;
  return aa / Math.max(1, bb);
}

function mean(xs: number[]): number {
  const a = xs.filter((v) => Number.isFinite(v));
  if (a.length === 0) return 0;
  return a.reduce((s, v) => s + v, 0) / a.length;
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function mustNumber(path: string, v: unknown, unknowns: UnknownCalc[], reason: string): number | null {
  if (isNum(v)) return v;
  unknowns.push({ json_path: path, reason, needed_inputs: [path] });
  return null;
}

function mustBoolean(path: string, v: unknown, unknowns: UnknownCalc[], reason: string): boolean | null {
  if (typeof v === "boolean") return v;
  unknowns.push({ json_path: path, reason, needed_inputs: [path] });
  return null;
}

// ------------------------------
// GPT Raw (minimal typing for derive)
// ------------------------------

export type StructureType = "linear" | "hierarchical" | "networked";

export interface EvidenceTypes {
  // The fixed formula uses a 4-bucket diversity count based on evidence_types.
  // We do not invent missing mapping keys. If evidence_types is missing, EDS is unknown.
  [k: string]: number | undefined;
}

export interface GptRawRawFeatures {
  units: number;
  claims: number;
  reasons: number;
  evidence: number;
  warrants: number;
  sub_claims: number;

  structure_type: StructureType;

  transitions: number;
  // Fixed spec expects a COUNT of valid transitions, not a boolean.
  transition_ok: number;

  revisions: number;
  revision_depth_sum: number; // sum(depth 1..3)
  belief_change: boolean;

  evidence_types: EvidenceTypes;

  intent_markers: number;
  drift_segments: number;

  hedges: number;
  loops: number;
}

export interface GptRaw {
  extraction_rules_version: string;
  warnings: string[];
  raw_features: Partial<GptRawRawFeatures>;
}

// ------------------------------
// CFF6 v1.0 (cff계산식.txt) - STRICT, NO FALLBACKS
// ------------------------------

export interface Cff6 {
  AAS: number | null;
  CTF: number | null;
  RMD: number | null;
  RDX: number | null;
  EDS: number | null;
  IFD: number | null;
}

function structureWeight(t: StructureType): number {
  // cff계산식.txt mapping
  switch (t) {
    case "networked":
      return 1.0;
    case "hierarchical":
      return 0.6;
    case "linear":
    default:
      return 0.3;
  }
}

function countEvidenceBuckets4(evidenceTypes: EvidenceTypes): number {
  // cff계산식.txt: 4 buckets (experience/data/example/principle)
  // We only count based on keys that exist in the payload.
  // NOTE: If your payload uses a different key set, define the mapping explicitly later.
  const get = (k: string) => (isNum(evidenceTypes[k]) ? (evidenceTypes[k] as number) : 0);

  // Common keys we have seen in previous drafts; NOT guaranteed. This is ONLY counting existing keys.
  // If you want an explicit mapping, provide it and we will lock it.
  const authority = get("authority") + get("citation");
  const data = get("numeric") + get("observation") + get("counterevidence");
  const example = get("example") + get("comparison");
  const principle = get("definition") + get("mechanism") + get("normative");

  return [authority, data, example, principle].filter((x) => x > 0).length;
}

function computeCff6Strict(gptRaw: GptRaw, unknowns: UnknownCalc[], known: KnownCalc[]): Cff6 {
  const rf = gptRaw?.raw_features ?? {};

  const units = mustNumber("gpt_raw.raw_features.units", rf.units, unknowns, "Required for CFF6 formula (cff계산식.txt).");
  const claims = mustNumber("gpt_raw.raw_features.claims", rf.claims, unknowns, "Required for CFF6 formula (cff계산식.txt).");
  const reasons = mustNumber("gpt_raw.raw_features.reasons", (rf as any).reasons, unknowns, "Required for RMD (cff계산식.txt). No proxy allowed.");
  const evidence = mustNumber("gpt_raw.raw_features.evidence", rf.evidence, unknowns, "Required for EDS (cff계산식.txt).");
  const warrants = mustNumber("gpt_raw.raw_features.warrants", rf.warrants, unknowns, "Required for AAS (cff계산식.txt).");
  const subClaims = mustNumber("gpt_raw.raw_features.sub_claims", (rf as any).sub_claims, unknowns, "Required for AAS (cff계산식.txt).");

  const st = (rf as any).structure_type as StructureType | undefined;
  if (st !== "linear" && st !== "hierarchical" && st !== "networked") {
    unknowns.push({
      json_path: "gpt_raw.raw_features.structure_type",
      reason: "Required for AAS (cff계산식.txt). No default allowed.",
      needed_inputs: ["gpt_raw.raw_features.structure_type"],
    });
  }

  const transitions = mustNumber("gpt_raw.raw_features.transitions", (rf as any).transitions, unknowns, "Required for CTF (cff계산식.txt).");
  const transitionOk = mustNumber("gpt_raw.raw_features.transition_ok", (rf as any).transition_ok, unknowns, "Required for CTF (cff계산식.txt) as COUNT, not boolean.");

  const revisions = mustNumber("gpt_raw.raw_features.revisions", (rf as any).revisions, unknowns, "Required for RDX (cff계산식.txt).");
  const revisionDepthSum = mustNumber(
    "gpt_raw.raw_features.revision_depth_sum",
    (rf as any).revision_depth_sum,
    unknowns,
    "Required for RDX (cff계산식.txt). No fallback from events allowed in strict mode.",
  );

  const beliefChange = mustBoolean(
    "gpt_raw.raw_features.belief_change",
    (rf as any).belief_change,
    unknowns,
    "Required for RDX belief bonus (cff계산식.txt). No default allowed.",
  );

  const evidenceTypes = (rf as any).evidence_types as EvidenceTypes | undefined;
  if (!evidenceTypes || typeof evidenceTypes !== "object") {
    unknowns.push({
      json_path: "gpt_raw.raw_features.evidence_types",
      reason: "Required for EDS type diversity (cff계산식.txt). No default allowed.",
      needed_inputs: ["gpt_raw.raw_features.evidence_types"],
    });
  }

  const intentMarkers = mustNumber(
    "gpt_raw.raw_features.intent_markers",
    (rf as any).intent_markers,
    unknowns,
    "Required for IFD (cff계산식.txt).",
  );

  const driftSegments = mustNumber(
    "gpt_raw.raw_features.drift_segments",
    (rf as any).drift_segments,
    unknowns,
    "Required for IFD drift_rate (cff계산식.txt). No default allowed.",
  );

  const hedges = mustNumber("gpt_raw.raw_features.hedges", (rf as any).hedges, unknowns, "Required for RMD (cff계산식.txt).");
  const loops = mustNumber("gpt_raw.raw_features.loops", (rf as any).loops, unknowns, "Required for RMD (cff계산식.txt).");

  // Compute each indicator ONLY if its required inputs are present.
  let AAS: number | null = null;
  if (units != null && claims != null && warrants != null && subClaims != null && st && isNum(transitions) /* st validated above */) {
    const hierarchyRatio = safeDiv(subClaims, Math.max(1, claims));
    const warrantRatio = safeDiv(warrants, Math.max(1, claims));
    AAS = clamp01(0.4 * hierarchyRatio + 0.4 * warrantRatio + 0.2 * structureWeight(st));

    known.push({
      name: "CFF.AAS",
      writes: ["backend.cff.indicator_scores.AAS"],
      spec_source: "cff계산식.txt",
      uses: ["gpt_raw.raw_features.sub_claims", "gpt_raw.raw_features.claims", "gpt_raw.raw_features.warrants", "gpt_raw.raw_features.structure_type"],
    });
  }

  let CTF: number | null = null;
  if (units != null && transitions != null && transitionOk != null) {
    const transitionDensity = safeDiv(transitions, Math.max(1, units));
    const validTransitionRatio = safeDiv(transitionOk, Math.max(1, transitions));
    CTF = clamp01(0.6 * transitionDensity + 0.4 * validTransitionRatio);

    known.push({
      name: "CFF.CTF",
      writes: ["backend.cff.indicator_scores.CTF"],
      spec_source: "cff계산식.txt",
      uses: ["gpt_raw.raw_features.transitions", "gpt_raw.raw_features.units", "gpt_raw.raw_features.transition_ok"],
    });
  }

  let RMD: number | null = null;
  if (units != null && reasons != null && hedges != null && loops != null) {
    const progressRate = safeDiv(reasons, Math.max(1, units));
    const frictionRate = safeDiv(hedges + loops, Math.max(1, units));
    RMD = clamp01(0.5 + (progressRate - frictionRate));

    known.push({
      name: "CFF.RMD",
      writes: ["backend.cff.indicator_scores.RMD"],
      spec_source: "cff계산식.txt",
      uses: ["gpt_raw.raw_features.reasons", "gpt_raw.raw_features.units", "gpt_raw.raw_features.hedges", "gpt_raw.raw_features.loops"],
    });
  }

  let RDX: number | null = null;
  if (revisions != null && revisionDepthSum != null && beliefChange != null) {
    const depthAvg = safeDiv(revisionDepthSum, Math.max(1, revisions));
    const beliefBonus = beliefChange ? 0.2 : 0.0;
    RDX = clamp01(0.7 * depthAvg + beliefBonus);

    known.push({
      name: "CFF.RDX",
      writes: ["backend.cff.indicator_scores.RDX"],
      spec_source: "cff계산식.txt",
      uses: ["gpt_raw.raw_features.revision_depth_sum", "gpt_raw.raw_features.revisions", "gpt_raw.raw_features.belief_change"],
    });
  }

  let EDS: number | null = null;
  if (evidenceTypes && claims != null && evidence != null) {
    const typeDiversity = clamp01(countEvidenceBuckets4(evidenceTypes) / 4);
    const evidenceDensity = safeDiv(evidence, Math.max(1, claims));
    EDS = clamp01(0.6 * typeDiversity + 0.4 * evidenceDensity);

    known.push({
      name: "CFF.EDS",
      writes: ["backend.cff.indicator_scores.EDS"],
      spec_source: "cff계산식.txt",
      uses: ["gpt_raw.raw_features.evidence_types", "gpt_raw.raw_features.evidence", "gpt_raw.raw_features.claims"],
    });
  }

  let IFD: number | null = null;
  if (units != null && intentMarkers != null && driftSegments != null) {
    const intentStrength = intentMarkers > 0 ? 1.0 : 0.5;
    const driftRate = safeDiv(driftSegments, Math.max(1, units));
    IFD = clamp01(intentStrength - driftRate);

    known.push({
      name: "CFF.IFD",
      writes: ["backend.cff.indicator_scores.IFD"],
      spec_source: "cff계산식.txt",
      uses: ["gpt_raw.raw_features.intent_markers", "gpt_raw.raw_features.drift_segments", "gpt_raw.raw_features.units"],
    });
  }

  return { AAS, CTF, RMD, RDX, EDS, IFD };
}

// ------------------------------
// Reliability band v1.0 (Reliability band 계산식.txt) - STRICT
// ------------------------------

export interface ReliabilityFromCff6Result {
  reliability_score: number;
  strength: number;
  coherence: number;
  band: BandHML;
}

export function reliabilityFromCff6(v: { AAS: number; CTF: number; RMD: number; RDX: number; EDS: number; IFD: number }): ReliabilityFromCff6Result {
  const xs = [v.AAS, v.CTF, v.RMD, v.RDX, v.EDS, v.IFD].map(clamp01);

  const strength = clamp01(mean(xs.map((x) => Math.abs(x - 0.5))) * 2);

  const pairs: Array<[number, number]> = [
    [v.AAS, v.CTF],
    [v.RDX, v.CTF],
    [v.EDS, v.AAS],
    [v.IFD, v.CTF],
  ];

  const penalties = pairs.map(([a, b]) => {
    const gap = Math.abs(clamp01(a) - clamp01(b));
    return clamp01((gap - 0.25) / 0.5);
  });

  const coherence = clamp01(1 - mean(penalties));
  const reliability_score = clamp01(0.6 * strength + 0.4 * coherence);

  let band: BandHML;
  if (strength < 0.3) band = "LOW";
  else if (reliability_score >= 0.7) band = "HIGH";
  else if (reliability_score >= 0.5) band = "MEDIUM";
  else band = "LOW";

  return { reliability_score, strength, coherence, band };
}

// ------------------------------
// Backend shape initialization
// ------------------------------

function ensureBackendShape(report: NeuPrintReport): void {
  if (!report.backend) report.backend = {} as any;

  if (!report.backend.cff) report.backend.cff = {} as any;
  if (!report.backend.cff.indicator_scores) report.backend.cff.indicator_scores = {} as any;
  if (!report.backend.control) report.backend.control = {} as any;

  if (!report.backend.control.reliability_score) {
    report.backend.control.reliability_score = {
      band: "LOW",
      method: "unknown",
      r: null as any,
      params: { alpha: null as any, beta: null as any, mu: null as any, tau: null as any },
    } as any;
  }
}

// ------------------------------
// Public API
// ------------------------------

export function deriveReport(
  report: NeuPrintReport,
  inputs: ComputeInputs = {},
): { report: NeuPrintReport; summary: DeriveSummary } {
  const known_calcs: KnownCalc[] = [];
  const unknown_calcs: UnknownCalc[] = [];
  const notes: string[] = [];

  ensureBackendShape(report);

  // 1) Compute CFF6 strictly (no substitution)
  const gptRaw: GptRaw | undefined = (report as any).gpt_raw;
  if (!gptRaw || !gptRaw.raw_features) {
    unknown_calcs.push({
      json_path: "gpt_raw.raw_features",
      reason: "Missing gpt_raw.raw_features, cannot compute any CFF indicators (cff계산식.txt).",
      needed_inputs: ["gpt_raw.raw_features"],
    });
  } else {
    const cff6 = computeCff6Strict(gptRaw, unknown_calcs, known_calcs);

    // Write what we computed; leave others null
    report.backend.cff.indicator_scores.AAS = cff6.AAS;
    report.backend.cff.indicator_scores.CTF = cff6.CTF;
    report.backend.cff.indicator_scores.RMD = cff6.RMD;
    report.backend.cff.indicator_scores.RDX = cff6.RDX;
    report.backend.cff.indicator_scores.EDS = cff6.EDS;
    report.backend.cff.indicator_scores.IFD = cff6.IFD;

    // KPF_SIM, TPS_H are telemetry/history; not computed here
    if (report.backend.cff.indicator_scores.KPF_SIM === undefined) report.backend.cff.indicator_scores.KPF_SIM = null;
    if (report.backend.cff.indicator_scores.TPS_H === undefined) report.backend.cff.indicator_scores.TPS_H = null;

    // 2) Reliability only if all CFF6 are available (strict)
    const allOk =
      isNum(cff6.AAS) &&
      isNum(cff6.CTF) &&
      isNum(cff6.RMD) &&
      isNum(cff6.RDX) &&
      isNum(cff6.EDS) &&
      isNum(cff6.IFD);

    if (allOk) {
      const rel = reliabilityFromCff6({
        AAS: cff6.AAS as number,
        CTF: cff6.CTF as number,
        RMD: cff6.RMD as number,
        RDX: cff6.RDX as number,
        EDS: cff6.EDS as number,
        IFD: cff6.IFD as number,
      });

      report.backend.control.reliability_score.method = "cff6_reliability_v1";
      report.backend.control.reliability_score.r = rel.reliability_score;
      report.backend.control.reliability_score.band = rel.band;
      report.backend.control.reliability_score.params = { alpha: 0, beta: 0, mu: 0, tau: 0 };

      known_calcs.push({
        name: "Reliability band from CFF6",
        writes: ["backend.control.reliability_score.{method,r,band,params}"],
        spec_source: "Reliability band 계산식.txt",
        uses: [
          "backend.cff.indicator_scores.AAS",
          "backend.cff.indicator_scores.CTF",
          "backend.cff.indicator_scores.RMD",
          "backend.cff.indicator_scores.RDX",
          "backend.cff.indicator_scores.EDS",
          "backend.cff.indicator_scores.IFD",
        ],
      });
    } else {
      // Do not invent reliability if any indicator is missing
      report.backend.control.reliability_score.method = "cff6_reliability_v1";
      report.backend.control.reliability_score.r = null as any;
      report.backend.control.reliability_score.band = "LOW"; // placeholder for UI safety; r=null indicates unknown
      report.backend.control.reliability_score.params = { alpha: null as any, beta: null as any, mu: null as any, tau: null as any };

      unknown_calcs.push({
        json_path: "backend.control.reliability_score",
        reason: "Reliability requires all CFF6 indicators. At least one indicator is null/unknown.",
        needed_inputs: [
          "backend.cff.indicator_scores.AAS",
          "backend.cff.indicator_scores.CTF",
          "backend.cff.indicator_scores.RMD",
          "backend.cff.indicator_scores.RDX",
          "backend.cff.indicator_scores.EDS",
          "backend.cff.indicator_scores.IFD",
        ],
      });
    }
  }

  notes.push("Strict derivation: no fallbacks, no default substitutions. Unknowns recorded for missing inputs.");

  // 3) Delegate remaining backend_required_calcs (Excel-driven)
  const delegated = computeBackendRequiredCalcs(report, inputs);
  report = delegated.report;
  unknown_calcs.push(...(delegated.unknown || []));

  return { report, summary: { known_calcs, unknown_calcs, notes } };
}
