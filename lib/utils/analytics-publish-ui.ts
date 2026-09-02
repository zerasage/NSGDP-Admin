import type { AnalyticsPublishStatus } from "@/lib/api/ingestion-review";

/** True while a warehouse publish job is actively running (not stalled). */
export function isAnalyticsLoadInFlight(
  status: AnalyticsPublishStatus | undefined,
): boolean {
  if (!status) return false;
  if (status.workerHint) return false;
  return (
    status.phase === "loading" ||
    status.phase === "updating" ||
    status.blockReason === "publish_in_flight"
  );
}

/** Manual load/retry — never while a healthy in-flight job is running. */
export function shouldShowLoadAnalyticsButton(
  status: AnalyticsPublishStatus | undefined,
  canPublish: boolean,
): boolean {
  if (!canPublish || !status) return false;
  if (isAnalyticsLoadInFlight(status)) return false;
  if (status.phase === "failed") return true;
  if (status.phase === "ready") return true;
  if (
    status.workerHint &&
    (status.phase === "loading" || status.phase === "updating")
  ) {
    return true;
  }
  return false;
}
