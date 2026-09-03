import type { AnalyticsPublishStatus } from "@/lib/api/ingestion-review";

/** Strip npm/dev commands and raw Postgres FKs from operator-facing copy. */
export function publicAnalyticsMessage(
  message: string | null | undefined,
): string | null {
  if (!message) return null;
  if (
    /npm run start:worker/i.test(message) ||
    /nsgdp-backend/i.test(message) ||
    /no worker is processing/i.test(message)
  ) {
    return "Analytics load stalled — background processing did not pick up the job. Retry the load. If it happens again, check System Health.";
  }
  if (/fk_disease_burden_lga/i.test(message)) {
    return "Analytics load failed because LGA geography is missing or was rebuilt. Rebuild the GIS gazetteer, re-run ingestion on this dataset, then retry.";
  }
  if (/fk_disease_burden_ward/i.test(message)) {
    return "Analytics load failed because ward geography is missing or was rebuilt. Rebuild the GIS gazetteer, re-run ingestion, then retry.";
  }
  if (/fk_disease_burden_facility/i.test(message)) {
    return "Analytics load failed because the facility registry is missing or was rebuilt. Rebuild the GIS gazetteer, re-run ingestion, then retry.";
  }
  if (/fk_disease_burden_indicator/i.test(message)) {
    return "Analytics load failed because a required indicator is missing. Seed the NHMIS dictionary, then retry.";
  }
  return message;
}

const LIVE_QUEUE = new Set(["active", "waiting", "delayed"]);

/** True while a warehouse job is queued, retrying, running, or retracting. */
export function isAnalyticsLoadInFlight(
  status: AnalyticsPublishStatus | undefined,
): boolean {
  if (!status) return false;
  if (status.phase === "retracting") return true;
  if (status.queueState && LIVE_QUEUE.has(status.queueState)) return true;
  return (
    status.phase === "loading" ||
    status.phase === "updating" ||
    status.blockReason === "publish_in_flight" ||
    status.blockReason === "retract_in_flight"
  );
}

export function isLiveAnalyticsStatus(
  status: AnalyticsPublishStatus | undefined,
): boolean {
  if (!status) return false;
  if (isAnalyticsLoadInFlight(status)) return true;
  return Boolean(status.ingestionInProgress);
}

/** Manual load/retry — never while a healthy in-flight job is running. */
export function shouldShowLoadAnalyticsButton(
  status: AnalyticsPublishStatus | undefined,
  canPublish: boolean,
): boolean {
  if (!canPublish || !status) return false;
  if (status.phase === "not_applicable") return false;
  if (isAnalyticsLoadInFlight(status)) return false;
  if (status.phase === "failed") return true;
  if (status.phase === "ready") return true;
  return false;
}
