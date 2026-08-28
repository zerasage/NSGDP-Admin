"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AnalyticsPipelineStepState,
  AnalyticsPublishStatus,
} from "@/lib/api/ingestion-review";

const STEP_LABELS = [
  { key: "ingested" as const, label: "Ingested" },
  { key: "aliasesClear" as const, label: "Aliases clear" },
  { key: "catalogueLive" as const, label: "Catalogue published" },
  { key: "analyticsLoaded" as const, label: "Analytics loaded" },
];

function StepIcon({ state }: { state: AnalyticsPipelineStepState }) {
  if (state === "done") {
    return <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />;
  }
  if (state === "active") {
    return <Loader2 className="size-4 animate-spin text-primary" aria-hidden />;
  }
  if (state === "blocked") {
    return <XCircle className="size-4 text-destructive" aria-hidden />;
  }
  return <Circle className="size-4 text-muted-foreground/50" aria-hidden />;
}

function phaseMessage(status: AnalyticsPublishStatus): string | null {
  switch (status.phase) {
    case "loading":
    case "updating":
      return status.workerHint
        ? status.workerHint
        : status.phase === "updating" && status.unpublishedRows > 0
          ? `Updating analytics with ${status.unpublishedRows.toLocaleString()} newly resolved rows…`
          : "Loading resolved rows into the analytics warehouse…";
    case "ready":
      return status.unpublishedRows > 0
        ? `${status.unpublishedRows.toLocaleString()} rows ready to load — analytics will load automatically.`
        : "Ready to load into analytics.";
    case "failed":
      return status.lastError ?? "Analytics load failed.";
    case "blocked":
      if (status.blockReason === "pending_aliases") {
        return `${status.pendingAliases} alias${status.pendingAliases === 1 ? "" : "es"} still pending.`;
      }
      if (status.blockReason === "catalogue_not_published") {
        return "Publish to the catalogue when ready — use the button below (not automatic).";
      }
      if (status.blockReason === "ingestion_not_ready") {
        return "Ingestion has not finished yet.";
      }
      if (status.blockReason === "ingestion_in_progress") {
        return "Canonicalization is running — alias counts and analytics will update when it finishes.";
      }
      if (status.blockReason === "ingestion_failed") {
        return "Last ingestion run failed — retry ingestion before analytics can load.";
      }
      if (status.blockReason === "publish_in_flight") {
        return "Analytics warehouse load is already in progress.";
      }
      if (status.blockReason === "nothing_to_publish") {
        return "No new resolved rows are waiting to load into analytics.";
      }
      if (status.blockReason === "fitness_blocked") {
        return "Workbook fitness blocks analytics load.";
      }
      return "Analytics is blocked.";
    case "loaded":
      return status.unpublishedRows > 0
        ? `Loaded. ${status.unpublishedRows.toLocaleString()} additional rows will load when org/indicator mapping completes.`
        : "Analytics warehouse is up to date.";
    default:
      return null;
  }
}

interface AnalyticsPipelineStripProps {
  status: AnalyticsPublishStatus;
  className?: string;
}

export function AnalyticsPipelineStrip({
  status,
  className,
}: AnalyticsPipelineStripProps) {
  if (status.phase === "not_applicable") return null;

  const message = phaseMessage(status);

  return (
    <div
      className={cn(
        "rounded-xl border bg-muted/20 px-4 py-3",
        status.phase === "failed" && "border-destructive/40 bg-destructive/5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {STEP_LABELS.map(({ key, label }, index) => {
          const state = status.steps[key];
          return (
            <div key={key} className="flex items-center gap-2">
              {index > 0 ? (
                <span
                  className="hidden sm:inline text-muted-foreground/40"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
              <StepIcon state={state} />
              <span
                className={cn(
                  "text-xs font-medium",
                  state === "done" && "text-foreground",
                  state === "active" && "text-primary",
                  state === "blocked" && "text-destructive",
                  state === "pending" && "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      {message ? (
        <p
          className={cn(
            "mt-2 text-xs text-muted-foreground",
            status.phase === "failed" && "text-destructive",
            (status.phase === "loading" || status.phase === "updating") &&
              status.workerHint &&
              "text-amber-800 dark:text-amber-200",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
