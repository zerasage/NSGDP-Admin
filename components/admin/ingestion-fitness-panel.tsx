"use client";

import { AlertTriangle, Ban, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MetricCard, Panel, type MetricTone } from "@/components/admin/admin-analytics-ui";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import {
  FITNESS_VERDICT_LABEL,
  fitnessTone,
  formatFitnessReason,
  needsFitnessAttention,
  type IngestionFitness,
} from "@/lib/utils/ingestion-fitness";

function MetricBar({
  label,
  pct,
  tone,
}: {
  label: string;
  pct: number;
  tone: MetricTone;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const barClass =
    tone === "destructive"
      ? "bg-destructive"
      : tone === "warning"
        ? "bg-warning"
        : tone === "success"
          ? "bg-success"
          : "bg-primary";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{clamped}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", barClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function IngestionFitnessBanner({ fitness }: { fitness: IngestionFitness | null | undefined }) {
  if (!needsFitnessAttention(fitness)) return null;

  const tone = fitnessTone(fitness.verdict);
  const Icon = fitness.verdict === "rejected_unusable" ? Ban : AlertTriangle;
  const borderClass =
    tone === "destructive"
      ? "border-destructive/30 bg-destructive/[0.05]"
      : "border-warning/30 bg-warning/[0.08]";

  return (
    <div
      role="alert"
      className={cn("rounded-2xl border px-4 py-4 sm:px-5", borderClass)}
    >
      <div className="flex gap-3">
        <Icon
          className={cn(
            "mt-0.5 size-5 shrink-0",
            tone === "destructive" ? "text-destructive" : "text-amber-700 dark:text-warning"
          )}
          aria-hidden
        />
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold leading-6">
              {FITNESS_VERDICT_LABEL[fitness.verdict]}
            </p>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] uppercase",
                tone === "destructive"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-warning/30 bg-warning/10 text-amber-700 dark:text-warning"
              )}
            >
              Fitness
            </Badge>
          </div>
          <p className="text-[13px] leading-6 text-muted-foreground">
            {fitness.verdict === "rejected_unusable"
              ? "This upload is unlikely to yield publishable warehouse data. Review the report before approving."
              : "Canonicalization completed with quality signals that need a human check before publish."}
          </p>
          {fitness.reasons.length > 0 && (
            <ul className="space-y-1 text-[13px] leading-6 text-muted-foreground">
              {fitness.reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>{formatFitnessReason(reason)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function IngestionFitnessPanel({ fitness }: { fitness: IngestionFitness | null | undefined }) {
  if (!fitness) return null;

  const tone = fitnessTone(fitness.verdict);
  const Icon =
    fitness.verdict === "rejected_unusable"
      ? Ban
      : fitness.verdict === "flagged"
        ? AlertTriangle
        : CheckCircle2;
  const { metrics } = fitness;

  return (
    <Panel
      title="Dataset fitness"
      description="Post-pipeline verdict from structure, geography, and resolution rates — not a semantic health classifier."
      icon={Icon}
      tone={tone}
      className={fitness.verdict === "ok" ? "border-success/25" : undefined}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-semibold uppercase",
              tone === "destructive"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : tone === "warning"
                  ? "border-warning/30 bg-warning/10 text-amber-700 dark:text-warning"
                  : "border-success/30 bg-success/10 text-success"
            )}
          >
            {FITNESS_VERDICT_LABEL[fitness.verdict]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Computed {formatDate(fitness.computedAt)}
          </span>
        </div>

        {fitness.reasons.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {fitness.reasons.map((reason) => (
              <Badge key={reason} variant="outline" className="border-border bg-muted/30 text-[11px]">
                {formatFitnessReason(reason)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No fitness concerns detected for this workbook.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Observations"
            value={metrics.observations.toLocaleString()}
            tone="info"
          />
          <MetricCard
            label="Usable"
            value={`${metrics.usablePct}%`}
            hint={`${metrics.usable.toLocaleString()} rows`}
            tone={metrics.usablePct >= 25 ? "success" : metrics.usablePct >= 5 ? "warning" : "destructive"}
          />
          <MetricCard
            label="Out of scope"
            value={`${metrics.outOfScopePct}%`}
            hint={`${metrics.outOfScope.toLocaleString()} rows`}
            tone={metrics.outOfScopePct >= 20 ? "warning" : "muted"}
          />
          <MetricCard
            label="Sheets"
            value={`${metrics.totalSheets - metrics.unknownSheets - metrics.archivedSheets}/${metrics.totalSheets}`}
            hint={
              metrics.unknownSheets + metrics.archivedSheets > 0
                ? `${metrics.unknownSheets} unknown, ${metrics.archivedSheets} archived`
                : "All sheets handled"
            }
            tone={metrics.unknownSheets > 0 ? "warning" : "muted"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricBar label="Usable rate" pct={metrics.usablePct} tone="success" />
          <MetricBar
            label="Out-of-scope geography"
            pct={metrics.outOfScopePct}
            tone={metrics.outOfScopePct >= 20 ? "warning" : "muted"}
          />
          <MetricBar
            label="Indicator pending"
            pct={metrics.indicatorPendingPct}
            tone={metrics.indicatorPendingPct >= 15 ? "warning" : "muted"}
          />
          <MetricBar
            label="Org unit pending"
            pct={metrics.orgPendingPct}
            tone={metrics.orgPendingPct >= 15 ? "warning" : "muted"}
          />
        </div>
      </div>
    </Panel>
  );
}
