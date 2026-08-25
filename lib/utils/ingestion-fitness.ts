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

export const FITNESS_VERDICT_LABEL: Record<IngestionFitnessVerdict, string> = {
  ok: "Fit for warehouse",
  flagged: "Flagged for review",
  rejected_unusable: "Rejected as unusable",
};

export const FITNESS_REASON_LABEL: Record<IngestionFitnessReason, string> = {
  UNSUPPORTED_FORMAT: "Unsupported file format (CSV, Excel, or JSON tabular only)",
  ZERO_OBSERVATIONS: "No observations extracted after triage",
  UNKNOWN_SHEETS: "Unrecognised sheet layouts",
  NON_OBSERVATION_STRUCTURE: "Workbook structure looks like a plan or form, not observation data",
  HIGH_OUT_OF_SCOPE: "High share of out-of-scope geography",
  LOW_USABLE_RATE: "Very few publishable observations",
  WRONG_GEOGRAPHY_HINT: "Title or sheet name suggests wrong state geography",
  HIGH_ORG_PENDING: "Many org units still unresolved",
  HIGH_INDICATOR_PENDING: "Many indicators still unresolved",
};

export function fitnessTone(verdict: IngestionFitnessVerdict): MetricTone {
  if (verdict === "rejected_unusable") return "destructive";
  if (verdict === "flagged") return "warning";
  return "success";
}

export function needsFitnessAttention(
  fitness: IngestionFitness | null | undefined
): fitness is IngestionFitness {
  return !!fitness && fitness.verdict !== "ok";
}

export function formatFitnessReason(reason: string): string {
  return FITNESS_REASON_LABEL[reason as IngestionFitnessReason] ?? reason;
}

/** Hard block publish when canonicalization rejected the upload. */
export function blocksPublishByFitness(
  fitness: IngestionFitness | null | undefined,
): boolean {
  return fitness?.verdict === "rejected_unusable";
}

export function publishBlockedByFitnessMessage(
  fitness: IngestionFitness
): string {
  if (fitness.reasons.length === 0) {
    return "Publish blocked: ingestion fitness is rejected as unusable. Open Ingestion to review the report.";
  }
  const summary = fitness.reasons.map(formatFitnessReason).join("; ");
  return `Publish blocked: ingestion fitness is rejected as unusable (${summary}).`;
}
