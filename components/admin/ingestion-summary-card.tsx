"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useIngestionProgress,
  useIngestionReport,
  useReviewQueue,
  useRunDatasetIngestion,
} from "@/lib/hooks/useIngestionReview";
import { IngestionProgressPanel } from "@/components/admin/ingestion-progress-panel";
import {
  INGESTION_STATUS_LABEL,
  ingestionCtaHref,
  ingestionCtaLabel,
  canManualRunIngestion,
  isIngestionInFlight,
  type IngestionStatus,
} from "@/lib/utils/ingestion-status";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface IngestionSummaryCardProps {
  datasetId: string;
  slug: string;
  ingestionStatus: IngestionStatus;
  catalogueStatus?: string;
  canManageIngestion?: boolean;
}

export function IngestionSummaryCard({
  datasetId,
  slug,
  ingestionStatus,
  catalogueStatus,
  canManageIngestion = false,
}: IngestionSummaryCardProps) {
  const router = useRouter();
  const { data: report, isLoading: reportLoading } = useIngestionReport(datasetId);
  const { data: aliases, isLoading: aliasesLoading } = useReviewQueue(datasetId);
  const { data: progress } = useIngestionProgress(datasetId);
  const runMutation = useRunDatasetIngestion(datasetId);
  const pendingAliases = aliases?.length ?? 0;
  const inFlight = isIngestionInFlight(ingestionStatus);
  const catalogueOk =
    !catalogueStatus ||
    catalogueStatus === "pending" ||
    catalogueStatus === "under_review" ||
    catalogueStatus === "approved";
  const showRun =
    canManageIngestion &&
    catalogueOk &&
    canManualRunIngestion(ingestionStatus) &&
    !inFlight;
  const showProgress =
    !!progress &&
    (inFlight ||
      progress.status === "pending" ||
      progress.status === "validating" ||
      progress.status === "processing" ||
      (ingestionStatus === "failed" && progress.status === "failed"));

  if (reportLoading || aliasesLoading) {
    return <Skeleton className="h-28 rounded-2xl" />;
  }

  const resolvedPct =
    report && report.stagingTotal > 0
      ? `${Math.round((report.resolved / report.stagingTotal) * 100)}%`
      : "—";

  const handleRun = () => {
    runMutation.mutate(
      { force: ingestionStatus === "failed" },
      {
        onSuccess: (result) => {
          if (result.action === "enqueued") {
            toast.success("Ingestion queued");
          } else if (result.action === "already_queued") {
            toast.message("Ingestion already queued for this file");
          } else {
            toast.message(result.reason ?? "Nothing to run");
          }
        },
        onError: (error: unknown) =>
          toast.error(
            error instanceof Error ? error.message : "Failed to start ingestion"
          ),
      }
    );
  };

  const helperCopy = (() => {
    if (ingestionStatus === "uploaded") {
      return "Ingestion is queued. Progress updates below as the worker claims the job.";
    }
    if (ingestionStatus === "processing") {
      return "Ingestion is running. Stage progress updates live below.";
    }
    if (ingestionStatus === "failed") {
      return "The last ingestion run failed. Retry to rebuild the report and alias queue.";
    }
    if (ingestionStatus === "not_ingested") {
      return "This dataset is in the review path but ingestion has not started. Run it to build the report and alias queue.";
    }
    if (pendingAliases > 0) {
      return `${pendingAliases} unresolved string${pendingAliases === 1 ? "" : "s"} need a human decision before publish is clean.`;
    }
    return "Workbook resolution summary for this dataset.";
  })();

  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold leading-6">Ingestion</h2>
            <Badge
              variant={
                ingestionStatus === "failed"
                  ? "destructive"
                  : pendingAliases > 0
                    ? "secondary"
                    : "outline"
              }
              className="gap-1.5 text-[11px] font-semibold uppercase"
            >
              {inFlight ? <Loader2 className="size-3 animate-spin" aria-hidden /> : null}
              {INGESTION_STATUS_LABEL[ingestionStatus]}
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground">{helperCopy}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {showRun && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              disabled={runMutation.isPending}
              onClick={handleRun}
            >
              {runMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Play className="size-3.5" aria-hidden />
              )}
              {ingestionStatus === "failed" ? "Retry ingestion" : "Run ingestion"}
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => router.push(ingestionCtaHref(slug, pendingAliases))}
          >
            {ingestionCtaLabel(ingestionStatus, pendingAliases)}
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      {showProgress && progress ? (
        <div className="border-b px-4 py-4 sm:px-5">
          <IngestionProgressPanel progress={progress} compact />
        </div>
      ) : null}

      <div className="grid gap-3 p-4 sm:grid-cols-4 sm:p-5">
        {[
          { label: "Staging rows", value: report?.stagingTotal?.toLocaleString() ?? "—" },
          { label: "Resolved", value: report?.resolved?.toLocaleString() ?? "—" },
          { label: "Auto-resolution", value: resolvedPct },
          {
            label: "Pending aliases",
            value: String(pendingAliases),
            warn: pendingAliases > 0,
          },
        ].map((m) => (
          <div
            key={m.label}
            className={cn(
              "rounded-xl border p-3",
              m.warn ? "border-warning/40 bg-warning/10" : "bg-muted/20"
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums tracking-tight">{m.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
