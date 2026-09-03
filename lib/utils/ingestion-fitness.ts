import type { MetricTone } from "@/components/admin/admin-analytics-ui";

export type IngestionFitnessVerdict = "ok" | "flagged" | "rejected_unusable";

export type IngestionFitnessReason =
  | "UNSUPPORTED_FORMAT"
  | "ZERO_OBSERVATIONS"
  | "UNKNOWN_SHEETS"
  | "NON_OBSERVATION_STRUCTURE"
  | "HIGH_OUT_OF_SCOPE"
  | "LOW_USABLE_RATE"
  | "WRONG_GEOGRAPHY_HINT"
  | "HIGH_ORG_PENDING"
  | "HIGH_INDICATOR_PENDING";

export interface IngestionFitnessMetrics {
  observations: number;
  outOfScope: number;
  outOfScopePct: number;
  orgPending: number;
  orgPendingPct: number;
  periodUnresolved: number;
  periodUnresolvedPct: number;
  indicatorPending: number;
  indicatorPendingPct: number;
  usable: number;
  usablePct: number;
  unknownSheets: number;
  archivedSheets: number;
  totalSheets: number;
}

export interface IngestionFitness {
  verdict: IngestionFitnessVerdict;
  reasons: IngestionFitnessReason[];
  metrics: IngestionFitnessMetrics;
  computedAt: string;
  notifiedAt?: string | null;
  notifiedVerdict?: IngestionFitnessVerdict | null;
}

/** Reasons that mean "different workbook shape", not bad data quality. */
const CATALOGUE_ONLY_REASONS = new Set<IngestionFitnessReason>([
  "UNSUPPORTED_FORMAT",
  "ZERO_OBSERVATIONS",
  "UNKNOWN_SHEETS",
  "NON_OBSERVATION_STRUCTURE",
]);

export const FITNESS_VERDICT_LABEL: Record<IngestionFitnessVerdict, string> = {
  ok: "Fit for warehouse",
  flagged: "Flagged for review",
  rejected_unusable: "Rejected for analytics",
};

export const FITNESS_REASON_LABEL: Record<IngestionFitnessReason, string> = {
  UNSUPPORTED_FORMAT:
    "File format is not the analytics grid pipeline (CSV/Excel indicator tables)",
  ZERO_OBSERVATIONS:
    "No indicator rows extracted — may be catalogue-only health data",
  UNKNOWN_SHEETS: "Sheet layouts were not recognised as observation grids",
  NON_OBSERVATION_STRUCTURE:
    "Workbook looks like a plan, form, or register — not an indicator grid",
  HIGH_OUT_OF_SCOPE: "High share of out-of-scope geography",
  LOW_USABLE_RATE: "Very few publishable observations",
  WRONG_GEOGRAPHY_HINT: "Title or sheet name suggests wrong state geography",
  HIGH_ORG_PENDING: "Many org units still unresolved",
  HIGH_INDICATOR_PENDING: "Many indicators still unresolved",
};

export function isCatalogueOnlyFitness(fitness: IngestionFitness): boolean {
  if (fitness.verdict !== "rejected_unusable") return false;
  if (fitness.reasons.length === 0) return true;
  return fitness.reasons.every((reason) => CATALOGUE_ONLY_REASONS.has(reason));
}

/** User-facing verdict — softer when the file is valid but not warehouse-shaped. */
export function fitnessVerdictLabel(fitness: IngestionFitness): string {
  if (fitness.verdict === "ok") return FITNESS_VERDICT_LABEL.ok;
  if (fitness.verdict === "flagged") return FITNESS_VERDICT_LABEL.flagged;
  if (isCatalogueOnlyFitness(fitness)) return "Not analytics-shaped";
  return FITNESS_VERDICT_LABEL.rejected_unusable;
}

export function fitnessVerdictDescription(fitness: IngestionFitness): string {
  if (fitness.verdict === "flagged") {
    return "Canonicalization completed with quality signals that need a human check before loading analytics.";
  }
  if (fitness.verdict === "rejected_unusable" && isCatalogueOnlyFitness(fitness)) {
    return "This file did not yield indicator rows for the analytics warehouse. Catalogue publish is still fine — it may be a different type of health data.";
  }
  if (fitness.verdict === "rejected_unusable") {
    return "This upload is unlikely to yield publishable warehouse data. Review the report before loading analytics.";
  }
  return "No analytics fitness concerns.";
}

export function fitnessTone(verdict: IngestionFitnessVerdict): MetricTone {
  if (verdict === "rejected_unusable") return "destructive";
  if (verdict === "flagged") return "warning";
  return "success";
}

export function fitnessDisplayTone(fitness: IngestionFitness): MetricTone {
  if (fitness.verdict === "ok") return "success";
  if (fitness.verdict === "flagged") return "warning";
  if (isCatalogueOnlyFitness(fitness)) return "info";
  return "destructive";
}

export function needsFitnessAttention(
  fitness: IngestionFitness | null | undefined
): fitness is IngestionFitness {
  return !!fitness && fitness.verdict !== "ok";
}

export function formatFitnessReason(reason: string): string {
  return FITNESS_REASON_LABEL[reason as IngestionFitnessReason] ?? reason;
}

/** True when preflight marked the file as a geography/denominator table. */
export function isCatalogueOnlyReport(
  report: Record<string, unknown> | null | undefined,
): boolean {
  const preflight = report?.preflight as { referenceOnly?: boolean } | undefined;
  return Boolean(preflight?.referenceOnly);
}

/** True when analytics is the wrong product for this file — not a failure. */
export function isAnalyticsNotApplicable(
  fitness: IngestionFitness | null | undefined,
  report?: Record<string, unknown> | null,
): boolean {
  if (fitness && isCatalogueOnlyFitness(fitness)) return true;
  return isCatalogueOnlyReport(report);
}

/** Hard block warehouse load for quality rejection. Catalogue-only is not a block. */
export function blocksPublishByFitness(
  fitness: IngestionFitness | null | undefined,
): boolean {
  if (!fitness || fitness.verdict !== "rejected_unusable") return false;
  return !isCatalogueOnlyFitness(fitness);
}

export function publishBlockedByFitnessMessage(
  fitness: IngestionFitness
): string {
  const summary =
    fitness.reasons.length > 0
      ? fitness.reasons.map(formatFitnessReason).join("; ")
      : "no warehouse observations";

  if (isCatalogueOnlyFitness(fitness)) {
    return `Not an indicator grid (${summary}). Catalogue publish is the outcome — there is no analytics pipeline for this file.`;
  }

  return `Analytics load blocked: ${fitnessVerdictLabel(fitness)} (${summary}). Open Ingestion to review the report.`;
}
