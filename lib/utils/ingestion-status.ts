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

export function isReadyForWarehousePublish(
  status: IngestionStatus | undefined | null,
  format?: string
): boolean {
  const tabular = !format || format === "csv" || format === "excel";
  if (!tabular) return true;
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
