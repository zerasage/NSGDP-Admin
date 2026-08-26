"use client";

import { Check, Circle, Loader2, X } from "lucide-react";
import type { IngestionProgress, IngestionStep } from "@/lib/api/ingestion-review";
import { cn } from "@/lib/utils";

function stepIcon(status: IngestionStep["status"]) {
  if (status === "completed" || status === "skipped") {
    return <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />;
  }
  if (status === "failed") {
    return <X className="size-3.5 text-destructive" aria-hidden />;
  }
  if (status === "running") {
    return <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />;
  }
  return <Circle className="size-3.5 text-muted-foreground/50" aria-hidden />;
}

/** True when every stage finished successfully even if job status was later overwritten. */
function looksComplete(progress: IngestionProgress): boolean {
  if (progress.status === "completed") return true;
  if ((progress.progress ?? 0) < 100) return false;
  if (!progress.steps?.length) return false;
  return progress.steps.every(
    (s) => s.status === "completed" || s.status === "skipped"
  );
}

function stageCaption(progress: IngestionProgress): string {
  if (progress.status === "pending") return "Queued — waiting for a worker";
  if (looksComplete(progress)) {
    if (progress.status === "failed") {
      return "Ingestion finished — queue later reported a stall; workbook data was written";
    }
    return "Ingestion complete";
  }
  if (progress.status === "failed") {
    return progress.errorMessage ?? "Ingestion failed";
  }
  if (progress.status === "cancelled") return "Ingestion cancelled";
  const running = progress.steps.find((s) => s.status === "running");
  if (running) {
    const count =
      running.itemsTotal != null
        ? ` · ${running.itemsDone.toLocaleString()} / ${running.itemsTotal.toLocaleString()}`
        : running.itemsDone > 0
          ? ` · ${running.itemsDone.toLocaleString()}`
          : "";
    return `${running.label}${count}`;
  }
  return "Running";
}

interface IngestionProgressPanelProps {
  progress: IngestionProgress;
  /** Compact bar only — used on the dataset summary card. */
  compact?: boolean;
  className?: string;
}

export function IngestionProgressPanel({
  progress,
  compact = false,
  className,
}: IngestionProgressPanelProps) {
  const pct = Math.min(100, Math.max(0, progress.progress ?? 0));
  const complete = looksComplete(progress);
  const trulyFailed = progress.status === "failed" && !complete;
  const active =
    !complete &&
    (progress.status === "pending" ||
      progress.status === "validating" ||
      progress.status === "processing");

  return (
    <section
      className={cn(
        compact ? "space-y-3" : "rounded-2xl border bg-card p-4 sm:p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pipeline progress
          </p>
          <p className="text-sm text-foreground">{stageCaption(progress)}</p>
        </div>
        <p className="text-lg font-bold tabular-nums tracking-tight">{pct}%</p>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Ingestion progress"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            trulyFailed
              ? "bg-destructive"
              : active
                ? "bg-primary"
                : "bg-emerald-600 dark:bg-emerald-500"
          )}
          style={{ width: `${progress.status === "pending" && pct === 0 ? 4 : pct}%` }}
        />
      </div>

      {!compact && (
        <ol className="mt-4 grid gap-1.5 sm:grid-cols-2">
          {progress.steps.map((step) => (
            <li
              key={step.key}
              className={cn(
                "flex items-start gap-2 rounded-xl border px-3 py-2 text-[13px]",
                step.status === "running" && "border-primary/40 bg-primary/5",
                step.status === "failed" && "border-destructive/40 bg-destructive/5"
              )}
            >
              <span className="mt-0.5 shrink-0">{stepIcon(step.status)}</span>
              <span className="min-w-0">
                <span className="font-medium leading-5">{step.label}</span>
                {step.message ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {step.message}
                  </span>
                ) : null}
                {step.status === "running" && step.itemsTotal != null ? (
                  <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                    {step.itemsDone.toLocaleString()} / {step.itemsTotal.toLocaleString()}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
