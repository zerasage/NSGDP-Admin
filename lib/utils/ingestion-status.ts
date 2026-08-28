import type { LucideIcon } from "lucide-react";
import { Activity, AlertTriangle, CheckCircle2, Loader2, Undo2 } from "lucide-react";

export type IngestionStatus =
  | "not_ingested"
  | "uploaded"
  | "processing"
  | "processed_pending_approval"
  | "published"
  | "retracting"
  | "retracted"
  | "failed";

export const INGESTION_STATUS_LABEL: Record<IngestionStatus, string> = {
  not_ingested: "Not started",
  uploaded: "Queued",
  processing: "Running",
  processed_pending_approval: "Ready for review",
  published: "Published to warehouse",
  retracting: "Retracting",
  retracted: "Retracted",
  failed: "Failed",
};

/** Live job row status from GET ingestion progress (may lead catalogue status). */
export type IngestionJobProgressStatus =
  | "pending"
  | "validating"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export function isJobProgressActive(
  status: IngestionJobProgressStatus | undefined | null,
): boolean {
  return status === "pending" || status === "validating" || status === "processing";
}

/** Minimal progress payload for display-status merge (avoids api layer import). */
export type IngestionProgressHint = {
  status?: IngestionJobProgressStatus | null;
  progress?: number | null;
  steps?: { status: string }[] | null;
};

/**
 * True when step counters or overall percent show work in flight even if the
 * job row status lagged (e.g. still `not_ingested` on the dataset).
 */
export function isProgressPipelineActive(
  progress: IngestionProgressHint | null | undefined,
): boolean {
  if (!progress) return false;
  if (progress.status === "failed" || progress.status === "cancelled") {
    return false;
  }
  if (isJobProgressActive(progress.status)) return true;
  if (progress.steps?.some((s) => s.status === "running")) return true;
  const pct = progress.progress ?? 0;
  return pct > 0 && pct < 100;
}

/**
 * Merge catalogue ingestion_status with the live ingestion_jobs row.
 * The dataset column can lag while the worker is running — progress is
 * the source of truth for queued/running/failed display.
 */
export function resolveIngestionDisplayStatus(
  catalogueStatus: IngestionStatus,
  progress?: IngestionProgressHint | null,
): IngestionStatus {
  const jobStatus = progress?.status;
  if (isProgressPipelineActive(progress)) {
    return jobStatus === "pending" ? "uploaded" : "processing";
  }
  if (!jobStatus) return catalogueStatus;
  if (jobStatus === "processing" || jobStatus === "validating") {
    return "processing";
  }
  if (jobStatus === "pending") {
    return "uploaded";
  }
  if (jobStatus === "failed") {
    if (
      catalogueStatus === "not_ingested" ||
      catalogueStatus === "uploaded" ||
      catalogueStatus === "processing"
    ) {
      return "failed";
    }
  }
  return catalogueStatus;
}

/** True once a workbook has entered (or finished) the ingestion pipeline. */
export function hasIngestionActivity(status: IngestionStatus | undefined | null): boolean {
  return !!status && status !== "not_ingested";
}

/** Pipeline has been claimed / is actively working — do not show Run. */
export function isIngestionInFlight(status: IngestionStatus | undefined | null): boolean {
  return (
    status === "uploaded" ||
    status === "processing" ||
    status === "retracting"
  );
}

/**
 * Statuses that still need a pipeline outcome (for messaging / catch-up eligibility).
 * Includes queued (`uploaded`) — that is in-flight, not a cue to click Run again.
 */
export function needsIngestionCatchUp(status: IngestionStatus | undefined | null): boolean {
  return (
    status === "not_ingested" ||
    status === "uploaded" ||
    status === "failed"
  );
}

/** When the admin may click Run / Retry (not while queued or running). */
export function canManualRunIngestion(status: IngestionStatus | undefined | null): boolean {
  return status === "not_ingested" || status === "failed";
}

/** When Stop should be shown — in-flight job or stuck processing state. */
export function canStopIngestion(
  displayStatus: IngestionStatus | undefined | null,
  progress?: IngestionProgressHint | null,
): boolean {
  if (isIngestionInFlight(displayStatus)) return true;
  if (isJobProgressActive(progress?.status)) return true;
  if (
    progress?.status === "failed" &&
    (displayStatus === "processing" ||
      displayStatus === "uploaded" ||
      progress.steps?.some((s) => s.status === "running"))
  ) {
    return true;
  }
  return false;
}

export function isReadyForWarehousePublish(
  status: IngestionStatus | undefined | null,
  format?: string
): boolean {
  const tabular = !format || format === "csv" || format === "excel";
  if (!tabular) return false;
  return (
    status === "processed_pending_approval" || status === "published"
  );
}

export function ingestionCtaLabel(
  status: IngestionStatus,
  pendingAliasCount = 0
): string {
  if (status === "uploaded") return "View ingestion queue";
  if (status === "processing") return "View ingestion progress";
  if (status === "failed") return "View ingestion failure";
  if (status === "retracting") return "View ingestion";
  if (pendingAliasCount > 0) {
    return `Resolve ${pendingAliasCount} alias${pendingAliasCount === 1 ? "" : "es"}`;
  }
  if (status === "processed_pending_approval") return "Open ingestion report";
  if (status === "published" || status === "retracted") return "Ingestion report";
  return "Open ingestion";
}

export function ingestionCtaHref(slug: string, pendingAliasCount = 0): string {
  const base = `/datasets/${slug}/ingestion`;
  if (pendingAliasCount > 0) return `${base}?tab=aliases`;
  return base;
}

export function ingestionStatusIcon(status: IngestionStatus): LucideIcon {
  switch (status) {
    case "processing":
    case "retracting":
      return Loader2;
    case "failed":
      return AlertTriangle;
    case "published":
      return CheckCircle2;
    case "retracted":
      return Undo2;
    default:
      return Activity;
  }
}
