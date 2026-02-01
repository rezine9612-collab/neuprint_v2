// lib/server/schema.ts
import { z } from "zod";

/**
 * NeuPrint Report JSON Schema (Zod)
 * Source of truth:
 * - neuprint_L2_to_L3_mapping_v1.1.xlsx
 *   - All_fields (296 json_path)
 *   - Backend / GPT_raw / UI_text / Catalog sheets
 * - backend_required_calcs.ts (field name consistency check)
 *
 * Goal:
 * - Define the report JSON shape required by UI + backend pipeline
 * - Catch missing fields and type errors early
 */

// -------------------------
// Shared primitives
// -------------------------
const ZFloat01 = z.number().min(0).max(1);
const ZPercent01 = z.number().min(0).max(1);
const ZBandHML = z.enum(["HIGH", "MEDIUM", "LOW"]);
const ZNullableFloat01 = ZFloat01.nullable();

const ZFloat_050_095 = z.number().min(0.5).max(0.95);
const ZInt_1_3 = z.number().int().min(1).max(3);

// -------------------------
// Request schema (API input)
// -------------------------
export const AnalyzeRequestSchema = z.object({
  text: z.string().min(1),
  prompt_id: z.string().optional(),
  task_id: z.string().optional(),
  user_id: z.string().optional(),
  input_language: z.string().optional(),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// -------------------------
// Catalog schemas (sheet columns reflect object shapes)
// -------------------------
const CatControlBandNotesItem = z.object({
  reliability_band: z.string(),
  note_en: z.string(),
});

const CatControlDistInterpretItem = z.object({
  control_pattern: z.string(),
  distribution_interpretation_en: z.string(),
});

const CatControlDistLabelsItem = z.object({
  label_code: z.string(),
  display_name: z.string(),
  notes: z.string().optional(),
});

const CatControlPatternsItem = z.object({
  control_pattern: z.string(),
  pattern_description_en: z.string(),
  default_reliability_band: z.string(),
  band_rationale_en: z.string(),
});

const CatDecisionOutputItem = z.object({
  decision_code: z.string(),
  decision_label: z.string(),
  sentence_en: z.string(),
});

const CatObservedStructSignalsItem = z.object({
  signal_id: z.string(),
  signal_text_en: z.string(),
  priority_tag: z.string().optional(),
});

const CatalogCohortNotesItem = z.object({
  cohort_range: z.string(),
  note_en: z.string(),
});

const CatalogFriNotesItem = z.object({
  fri_range: z.string(),
  note_en: z.string(),
});

const CatalogJobsItem = z.object({
  group_id: z.number().int(),
  group_name: z.string(),
  job_id: z.number().int(),
  job_name: z.string(),
});

const CatalogObservedPatternsItem = z.object({
  code: z.string(),
  label: z.string(),
  description: z.string(),
});

const CatalogRoleGroupJobsItem = z.object({
  group_id: z.number().int(),
  group_name: z.string(),
});

const CatalogRoleGroupsItem = z.object({
  group_id: z.number().int(),
  group_name: z.string(),
});

const CatalogRslLevelsItem = z.object({
  level_code: z.string(),
  level_short_name: z.string(),
  level_full_name: z.string(),
  level_description: z.string(),
});

const CatalogStabilityIndexNotesItem = z.object({
  threshold: z.number(),
  band: z.string(),
  note_en: z.string(),
});

const CatRolefitExplTemplatesItem = z.object({
  template_key: z.string(),
  template_en: z.string(),
});

const CatRolefitWhyTemplatesItem = z.object({
  fit_band: z.string(),
  template_en: z.string(),
});

const CatalogCffFinalTypesItem = z.object({
  type_code: z.string(),
  type_name: z.string(),
  type_description: z.string(),
});

const CatalogSchema = z.object({
  // xlsx Catalog sheet: catalog.cat_*[] datasets
  cat_control_band_notes: z.array(CatControlBandNotesItem),
  cat_control_dist_interpret: z.array(CatControlDistInterpretItem),
  cat_control_dist_labels: z.array(CatControlDistLabelsItem),
  cat_control_patterns: z.array(CatControlPatternsItem),
  cat_decision_output: z.array(CatDecisionOutputItem),
  cat_observed_struct_signals: z.array(CatObservedStructSignalsItem),
  catalog_cohort_notes: z.array(CatalogCohortNotesItem),
  catalog_fri_notes: z.array(CatalogFriNotesItem),
  catalog_jobs: z.array(CatalogJobsItem),
  catalog_observed_patterns: z.array(CatalogObservedPatternsItem),
  catalog_role_group_jobs: z.array(CatalogRoleGroupJobsItem),
  catalog_role_groups: z.array(CatalogRoleGroupsItem),
  catalog_rsl_levels: z.array(CatalogRslLevelsItem),
  catalog_stability_index_notes: z.array(CatalogStabilityIndexNotesItem),
  cat_rolefit_expl_templates: z.array(CatRolefitExplTemplatesItem),
  cat_rolefit_why_templates: z.array(CatRolefitWhyTemplatesItem),
  catalog_cff_final_types: z.array(CatalogCffFinalTypesItem),
});

// -------------------------
// UI_text schema (13 keys from UI_text sheet)
// -------------------------
const UiTextSchema = z.object({
  cff: z.object({
    final_explanation_text: z.string(),
    final_lead_text: z.string(),
    pattern_primary_description_text: z.string(),
    pattern_secondary_description_text: z.string(),
  }),
  control: z.object({
    lead_text: z.string(),
    signals_text: z.array(z.string()),
    summary_text: z.string(),
  }),
  role_fit: z.object({
    cognitive_style_summary_text: z.string(),
    explanation_text: z.string(),
    job_why_one_sentence_texts: z.array(
      z.object({
        job_id: z.number().int().optional(),
        job_name: z.string().optional(),
        text: z.string().optional(),
      })
    ),
    why_template: z.string(),
  }),
  rsl: z.object({
    by_dimension_notes: z.array(
      z.object({
        code: z.string().optional(),
        note: z.string().optional(),
      })
    ),
    overall_summary_text: z.string(),
  }),
});

// -------------------------
// GPT_raw schema (All_fields 기준)
// -------------------------
const GptRawSchema = z.object({
  extraction_rules_version: z.string(),
  warnings: z.array(z.string()),

  events: z.object({
    revisions: z.array(
      z.object({
        depth: ZInt_1_3,
        note: z.string(),
        rev_id: z.string(),
        trigger_marker: z.string(),
        // Excel says enum, but allowed values are not enumerated in sheets.
        // To avoid false failures, keep as string and constrain later if needed.
        type: z.string(),
      })
    ),
  }),

  raw_features: z.object({
    units: z.number().int(),
    claims: z.number().int(),
    sub_claims: z.number().int(),
    evidence: z.number().int(),
    warrants: z.number().int(),
    counterpoints: z.number().int(),
    refutations: z.number().int(),

    transitions: z.number().int(),
    loops: z.number().int(),
    revisions: z.number().int(),

    adjacency_links: z.number().int(),
    cross_links: z.number().int(),

    hedges: z.number().int(),
    intent_markers: z.number().int(),

    transition_ok: z.boolean(),

    evidence_types: z.object({
      authority: z.number().int(),
      citation: z.number().int(),
      comparison: z.number().int(),
      counterevidence: z.number().int(),
      definition: z.number().int(),
      example: z.number().int(),
      mechanism: z.number().int(),
      normative: z.number().int(),
      numeric: z.number().int(),
      observation: z.number().int(),
      other: z.number().int(),
    }),
  }),
});

// -------------------------
// Backend schema (All_fields 기준)
// -------------------------
const BackendSchema = z.object({
  // backend.meta
  meta: z.object({
    report_id: z.string(),
    model_version: z.string(),
    data_version: z.string(),
    stability_index: z.number(),
    stability_note: z.string(),
    cohort_percentile: z.number(),
    cohort_position_note: z.string(),
  }),

  // backend.fri
  fri: z.object({
    score: z.number(),
    label: z.string(),
    control: z.string(),
  }),

  // backend.decision_output
  decision_output: z.object({
    determination: z.string(),
    label: z.string(),
    reliability: z.number(),
    reliability_band: z.string(),
    type_confidence: z.number(),
  }),

  // backend.rsl
  rsl: z.object({
    dimension_scores: z.object({
      R1: ZFloat01,
      R2: ZFloat01,
      R3: ZFloat01,
      R4: ZFloat01,
      R5: ZFloat01,
      R6: ZFloat01,
      R7: ZFloat01,
      R8: ZFloat01,
    }),

    aggregates_for_patterns: z.object({
      rsl_control: ZFloat01,
      rsl_expansion: ZFloat01,
      rsl_hypothesis: ZFloat01,
      rsl_validation: ZFloat01,
    }),

    overall: z.object({
      level_code: z.string(),
      level_short_name: z.string(),
      level_full_name: z.string(),
      level_description: z.string(),
      level_score: z.number(),
    }),

    cohort: z.object({
      percentile_0to1: ZPercent01,
      placement_display: z.string(),
    }),

    stability: z.object({
      stability_index: z.number(),
    }),

    charts: z.object({
      cohort_positioning: z.object({
        // unknown_backend_required_calcs.json에 따르면 외부 코호트 분포가 필요하므로
        // 구조만 잡고 optional로 둔다.
        distribution: z
          .array(
            z.object({
              // 실제 컬럼명이 엑셀에 확정되어 있지 않으므로 유연하게 수용
              // (예: bin, share, x, y 등)
            }).catchall(z.union([z.number(), z.string()]))
          )
          .optional(),
        marker: z
          .object({})
          .catchall(z.union([z.number(), z.string()]))
          .optional(),
      }),
      radar: z.object({
        values: z.array(z.number()).optional(),
      }),
    }),
  }),

  // backend.cff
  cff: z.object({
    axes: z.object({
      expansion_axis: z.object({
        exploration: ZFloat01,
      }),
      stability_axis: z.object({
        structure: ZFloat01,
      }),
    }),

    derived_scores: z.object({
      human_rhythm_index: ZFloat01,
      revision_depth: ZFloat01,
      structural_variance: ZFloat01,
      transition_flow: ZFloat01,
    }),

    indicator_scores: z.object({
      AAS: ZNullableFloat01,
      CTF: ZNullableFloat01,
      EDS: ZNullableFloat01,
      IFD: ZNullableFloat01,
      KPF_SIM: ZNullableFloat01,
      RDX: ZNullableFloat01,
      RMD: ZNullableFloat01,
      TPS_H: ZNullableFloat01,
    }),

    final_determination: z.object({
      display_name: z.string(),
      type_code: z.string(),
      type_confidence: ZFloat01,
    }),

    observed_patterns: z.object({
      primary: z.object({
        label: z.string(),
        score: ZFloat01,
      }),
      secondary: z.object({
        label: z.string(),
        score: ZFloat01,
      }),

      pattern_confidence: z.object({
        confidence: ZFloat_050_095,
        delta_top1_top2: ZFloat01,
      }),

      all_pattern_scores: z.object({
        S_AR: ZFloat01,
        S_CE: ZFloat01,
        S_IE: ZFloat01,
        S_LR: ZFloat01,
        S_PT: ZFloat01,
        S_RE: ZFloat01,
      }),
    }),
  }),

  // backend.control
  control: z.object({
    control_vector: z.object({
      A_agency: ZFloat01,
      D_depth: ZFloat01,
      R_reflection: ZFloat01,
    }),

    distribution_share: z.object({
      human: ZFloat01,
      hybrid: ZFloat01,
      ai: ZFloat01,
    }),

    distribution_pct: z.object({
      result: z.number(),
    }),

    ranking: z.object({
      best_pattern: z.string(),
      d1: z.number(),
      d2: z.number(),
      margin: z.number(),
    }),

    reliability_score: z.object({
      band: ZBandHML,
      method: z.string(),
      r: ZFloat01,
      params: z.object({
        alpha: z.number(),
        beta: z.number(),
        mu: z.number(),
        tau: z.number(),
      }),
    }),
  }),

  // backend.role_fit
  role_fit: z.object({
    exploration_level: ZBandHML,
    structure_level: ZBandHML,
    cognitive_style_summary: z.string(),
    summary: z.string(),

    track_scores: z.array(
      z.object({
        group_id: z.number().int(),
        group_name: z.string(),
        score: z.number(),
      })
    ),

    top_role_groups: z.array(
      z.object({
        group_id: z.number().int(),
        group_name: z.string(),
        score: z.number(),
        why: z.string(),
      })
    ),

    top_jobs: z.array(
      z.object({
        job_id: z.number().int(),
        job_name: z.string(),
        occupation_score: z.number(),
        why: z.string(),
      })
    ),
  }),
});

// -------------------------
// Meta schema (All_fields 기준)
// -------------------------
const MetaSchema = z.object({
  report_id: z.string(),
  analysis_timestamp_iso: z.string(),
  model_version: z.string(),
  data_version: z.string(),
  schema_version: z.string(),
  task_domain: z.string(),
  input_language: z.string(),
  verification_id: z.string(),
  verification_url: z.string(),

  ui: z.object({
    sections: z.object({
      rsl: z.object({ title: z.string(), lead: z.string() }),
      cff: z.object({ title: z.string(), lead: z.string() }),
      control: z.object({ title: z.string(), lead: z.string() }),
      role_fit: z.object({ title: z.string(), lead: z.string() }),
    }),

    /**
     * meta.ui.text_blocks.* 는 All_fields에 매우 많은 고정 문구 키가 포함되어 있음.
     * 여기서 모든 키를 1:1로 강제하면 유지보수가 불가능해지므로,
     * "string values"라는 타입 안정성만 보장하고 키는 유연하게 받는다.
     */
    text_blocks: z
      .object({})
      .catchall(
        z.union([
          z.string(),
          z.object({}).catchall(z.string()),
        ])
      ),
  }),
});

// -------------------------
// Submission schema (All_fields 기준)
// -------------------------
const SubmissionSchema = z.object({
  text: z.string(),
  prompt_id: z.string(),
  task_id: z.string(),
  user_id: z.string().nullable(),
});

// -------------------------
// Final Report schema
// -------------------------
export const ReportSchema = z.object({
  meta: MetaSchema,
  submission: SubmissionSchema,
  gpt_raw: GptRawSchema,
  backend: BackendSchema,
  ui_text: UiTextSchema,
  catalog: CatalogSchema,
});

export type ReportJson = z.infer<typeof ReportSchema>;

// For convenience
export const AnalyzeResponseSchema = ReportSchema;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

// -------------------------
// Helpers
// -------------------------
export function validateAnalyzeRequest(input: unknown): AnalyzeRequest {
  return AnalyzeRequestSchema.parse(input);
}

export function validateReportJson(input: unknown): ReportJson {
  return ReportSchema.parse(input);
}
