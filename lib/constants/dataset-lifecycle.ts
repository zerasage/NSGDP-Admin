import type { LifecycleStage } from "@/types";

/**
 * Practical 5-step dataset lifecycle for a government portal.
 *
 * The former 9-stage model split metadata review, technical validation, and
 * QA into separate gates — redundant when the 8-dimension QA checklist already
 * covers completeness, accuracy, consistency, timeliness, validity,
 * uniqueness, geo-references, and documentation in one review session.
 *
 * Archived is a terminal admin action, not part of the active pipeline.
 */
export const LIFECYCLE_PIPELINE: Array<{
  stage: LifecycleStage;
  label: string;
  role: string;
  description: string;
}> = [
  {
    stage: "draft",
    label: "Draft",
    role: "Contributor / Custodian",
    description: "Dataset prepared locally; metadata may be incomplete.",
  },
  {
    stage: "submitted",
    label: "Submitted",
    role: "Contributor",
    description: "Formal submission entered into the review queue.",
  },
  {
    stage: "under_review",
    label: "Under Review",
    role: "Validator / Custodian",
    description:
      "Single review gate — complete the 8-dimension QA checklist (metadata, technical, and quality checks).",
  },
  {
    stage: "approved",
    label: "Approved",
    role: "Repo Admin / Director",
    description: "Checklist passed; awaiting director sign-off before publication.",
  },
  {
    stage: "published",
    label: "Published",
    role: "Public catalogue",
    description: "Live in the data portal; subject to scheduled updates.",
  },
];

export const LIFECYCLE_PIPELINE_STAGES = LIFECYCLE_PIPELINE.map((s) => s.stage);

/** Maps legacy 9-stage values to the simplified model (for mock / migration). */
export function normalizeLifecycleStage(stage: string): LifecycleStage {
  const map: Record<string, LifecycleStage> = {
    creation: "draft",
    submission: "submitted",
    metadata_review: "under_review",
    technical_validation: "under_review",
    quality_assurance: "under_review",
    director_approval: "approved",
    periodic_update: "published",
    draft: "draft",
    submitted: "submitted",
    under_review: "under_review",
    approved: "approved",
    published: "published",
    archived: "archived",
  };
  return map[stage] ?? "submitted";
}

export const LIFECYCLE_RATIONALE = {
  headline: "5-step lifecycle with checklist-driven review",
  summary:
    "Government portals need clear accountability, not bureaucratic micro-gates. One structured QA review replaces three redundant validation stages.",
  checklistReplaces: [
    "Metadata Review → Completeness, Documentation, Validity",
    "Technical Validation → Geo-References, Uniqueness, Validity",
    "Quality Assurance → Accuracy, Consistency, Timeliness",
  ],
};
