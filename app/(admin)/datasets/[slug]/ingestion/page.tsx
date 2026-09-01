"use client";

import { use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ClipboardList, GitBranch, Link2, Loader2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import {
  AdminSectionTabsNav,
  ADMIN_TAB_TRIGGER_BASE,
  AdminTabCount,
} from "@/components/admin/admin-section-tabs-nav";
import { tabToneClass } from "@/components/admin/admin-analytics-ui";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/feedback/empty-state";
import { IngestionReportTab } from "@/components/admin/ingestion-report-tab";
import { IngestionProgressPanel } from "@/components/admin/ingestion-progress-panel";
import { DataReviewQueueTab } from "@/components/admin/data-review-queue-tab";
import { RelatedDatasetsTab } from "@/components/admin/related-datasets-tab";
import { DatasetAnalyticsPublishPanel } from "@/components/admin/dataset-analytics-publish-panel";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import {
  useIngestionProgress,
  useIngestionReport,
  useReviewQueue,
  useRunDatasetIngestion,
  useCancelDatasetIngestion,
  INGESTION_PROGRESS_KEY,
} from "@/lib/hooks/useIngestionReview";
import type { IngestionProgress } from "@/lib/api/ingestion-review";
import { IngestionFitnessBanner } from "@/components/admin/ingestion-fitness-panel";
import {
  INGESTION_STATUS_LABEL,
  canManualRunIngestion,
  hasIngestionActivity,
  isIngestionInFlight,
  isProgressPipelineActive,
  canStopIngestion,
  resolveIngestionDisplayStatus,
  type IngestionStatus,
} from "@/lib/utils/ingestion-status";
import { isCatalogueOnlyFitness } from "@/lib/utils/ingestion-fitness";
import { toast } from "sonner";

type IngestionTab = "report" | "aliases" | "related";

interface Dataset {
  id: string;
  title: string;
  slug: string;
  format: string;
  status: string;
  ingestion_status: IngestionStatus;
  published_at: string | null;
  analytics_published_at: string | null;
}

function parseTab(value: string | null): IngestionTab {
  if (value === "aliases" || value === "related" || value === "report") return value;
  return "report";
}

export default function DatasetIngestionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const { user } = useAuth();
  const { can, canAny } = useAdminAccess();
  const canView = canAny("approve:datasets", "publish:datasets", "manage:indicators");
  const canManageIndicators = can("manage:indicators");
  const canPublish = can("publish:datasets");
  const queryClient = useQueryClient();

  const { data: dataset, isLoading, error } = useQuery({
    queryKey: ["dataset", slug],
    enabled: canView,
    queryFn: async () => {
      const response = await apiClient.get<{ data: Dataset }>(`/admin/datasets/${slug}`);
      return response.data.data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.ingestion_status;
      if (isIngestionInFlight(status)) return 3000;
      const datasetId = query.state.data?.id;
      if (datasetId) {
        const jobProgress = queryClient.getQueryData<IngestionProgress | null>([
          INGESTION_PROGRESS_KEY,
          datasetId,
        ]);
        if (isProgressPipelineActive(jobProgress)) return 3000;
        const analyticsStatus = queryClient.getQueryData<{
          phase?: string;
        } | null>(["analytics-publish-status", datasetId]);
        if (
          analyticsStatus?.phase === "loading" ||
          analyticsStatus?.phase === "updating"
        ) {
          return 3000;
        }
      }
      return false;
    },
  });

  const { data: aliases } = useReviewQueue(
    canView && dataset ? dataset.id : undefined
  );
  const { data: progress } = useIngestionProgress(
    canView && dataset ? dataset.id : undefined
  );
  const { data: ingestionReport } = useIngestionReport(
    canView && dataset ? dataset.id : undefined
  );
  const pendingAliases = aliases?.length ?? 0;
  const runMutation = useRunDatasetIngestion(dataset?.id);
  const cancelMutation = useCancelDatasetIngestion(dataset?.id);
  const displayStatus = resolveIngestionDisplayStatus(
    dataset?.ingestion_status ?? "not_ingested",
    progress,
  );

  const description = useMemo(() => {
    if (!dataset) return "";
    if (displayStatus === "uploaded") {
      return "Ingestion is queued. Status will move to Running when a worker claims the job.";
    }
    if (displayStatus === "not_ingested") {
      return "Ingestion has not started for this dataset. Run it to process the workbook.";
    }
    if (displayStatus === "failed") {
      return "The last ingestion run failed. Retry to rebuild the report and alias queue.";
    }
    if (displayStatus === "processing") {
      return "Ingestion is running. Metrics refresh as stages complete.";
    }
    if (pendingAliases > 0) {
      return `${pendingAliases} pending alias decision${pendingAliases === 1 ? "" : "s"} for this workbook.`;
    }
    return "Resolution report, alias decisions, and related datasets for this upload.";
  }, [dataset, displayStatus, pendingAliases]);

  const handleRun = (force = false) => {
    runMutation.mutate(
      { force },
      {
        onSuccess: (result) => {
          if (result.action === "enqueued") toast.success("Ingestion queued");
          else if (result.action === "already_queued")
            toast.message("Ingestion already queued for this file");
          else toast.message(result.reason ?? "Nothing to run");
        },
        onError: (error: unknown) =>
          toast.error(
            error instanceof Error ? error.message : "Failed to start ingestion"
          ),
      }
    );
  };

  const handleStop = () => {
    cancelMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.cancelled) {
          toast.success("Ingestion stopped — you can retry when ready.");
        } else if (result.reason === "already_terminal") {
          toast.message("Cleared stuck processing state — safe to retry.");
        } else {
          toast.message("No in-flight ingestion to stop.");
        }
      },
      onError: (error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "Failed to stop ingestion"
        ),
    });
  };

  if (!canView) {
    return (
      <EmptyState
        title="Access restricted"
        description="Viewing ingestion requires approve:datasets, publish:datasets, or manage:indicators."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/datasets/${slug}`)}>
          <ArrowLeft className="size-4" />
          Back to dataset
        </Button>
        <Alert variant="destructive">
          <AlertDescription>Dataset not found or you don&apos;t have permission to view it.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasIngestionActivity(displayStatus) && !isProgressPipelineActive(progress)) {
    const canRun =
      canManageIndicators &&
      (dataset.status === "pending" ||
        dataset.status === "under_review" ||
        dataset.status === "approved");
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 gap-1.5"
          onClick={() => router.push(`/datasets/${slug}`)}
        >
          <ArrowLeft className="size-4" aria-hidden />
          {dataset.title}
        </Button>
        <EmptyState
          title="No ingestion yet"
          description={
            dataset.status === "draft"
              ? "Draft datasets are not ingested. Submit for review to start the pipeline."
              : "Ingestion starts on submit-for-review, or you can run catch-up now for datasets already in the review path."
          }
        />
        {canRun && (
          <div className="flex justify-center">
            <Button
              onClick={() => handleRun(false)}
              disabled={runMutation.isPending}
              className="gap-1.5"
            >
              {runMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
              Run ingestion
            </Button>
          </div>
        )}
      </div>
    );
  }

  const inFlight = isIngestionInFlight(displayStatus);
  const showStop =
    canManageIndicators && canStopIngestion(displayStatus, progress);
  const showRun =
    canManageIndicators &&
    !inFlight &&
    !showStop &&
    (dataset.status === "pending" ||
      dataset.status === "under_review" ||
      dataset.status === "approved") &&
    (canManualRunIngestion(displayStatus) ||
      displayStatus === "processed_pending_approval");

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 -ml-3 gap-1.5"
          onClick={() => router.push(`/datasets/${slug}`)}
        >
          <ArrowLeft className="size-4" aria-hidden />
          {dataset.title}
        </Button>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold leading-8">Ingestion</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={displayStatus === "failed" ? "destructive" : "outline"}
              className="w-fit gap-1.5 text-[11px] font-semibold uppercase"
            >
              {inFlight ? <Loader2 className="size-3 animate-spin" aria-hidden /> : null}
              {INGESTION_STATUS_LABEL[displayStatus]}
            </Badge>
            {showStop && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                disabled={cancelMutation.isPending}
                onClick={handleStop}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Square className="size-3.5" aria-hidden />
                )}
                Stop ingestion
              </Button>
            )}
            {showRun && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={runMutation.isPending}
                  onClick={() =>
                    handleRun(
                      displayStatus === "failed" ||
                        displayStatus === "processed_pending_approval"
                    )
                  }
                >
                  {runMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Play className="size-3.5" aria-hidden />
                  )}
                  {displayStatus === "processed_pending_approval"
                    ? "Re-run ingestion"
                    : displayStatus === "failed"
                      ? "Retry ingestion"
                      : "Run ingestion"}
                </Button>
              )}
          </div>
        </div>
      </div>

      {!canManageIndicators && pendingAliases > 0 && (
        <Alert>
          <AlertDescription>
            There are pending alias decisions. Confirming or rejecting them requires{" "}
            <span className="font-medium">manage:indicators</span>. You can still read the report.
          </AlertDescription>
        </Alert>
      )}

      <IngestionFitnessBanner fitness={ingestionReport?.fitness} />

      {(dataset.format === "csv" || dataset.format === "excel") &&
        !(
          ingestionReport?.fitness &&
          isCatalogueOnlyFitness(ingestionReport.fitness)
        ) && (
          <DatasetAnalyticsPublishPanel
            slug={slug}
            datasetId={dataset.id}
            format={dataset.format}
            status={dataset.status}
            publishedAt={dataset.published_at}
            analyticsPublishedAt={dataset.analytics_published_at}
            canPublish={canPublish && dataset.status === "approved"}
            showCatalogueControls={false}
          />
        )}

      {progress &&
        (inFlight ||
          isProgressPipelineActive(progress) ||
          (progress.status === "failed" &&
            displayStatus !== "processed_pending_approval" &&
            displayStatus !== "published")) && (
          <IngestionProgressPanel progress={progress} />
        )}

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = parseTab(value);
          const params = new URLSearchParams(searchParams.toString());
          if (next === "report") params.delete("tab");
          else params.set("tab", next);
          const qs = params.toString();
          router.replace(qs ? `/datasets/${slug}/ingestion?${qs}` : `/datasets/${slug}/ingestion`);
        }}
        className="space-y-4"
      >
        <AdminSectionTabsNav>
          <TabsTrigger value="report" className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("primary"))}>
            <ClipboardList className="size-3.5 shrink-0 sm:size-4" aria-hidden />
            Report
          </TabsTrigger>
          <TabsTrigger value="aliases" className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("warning"))}>
            <Link2 className="size-3.5 shrink-0 sm:size-4" aria-hidden />
            Aliases
            <AdminTabCount count={pendingAliases} active={tab === "aliases"} />
          </TabsTrigger>
          <TabsTrigger value="related" className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("info"))}>
            <GitBranch className="size-3.5 shrink-0 sm:size-4" aria-hidden />
            Related
          </TabsTrigger>
        </AdminSectionTabsNav>
        <TabsContent value="report" className="mt-0">
          <IngestionReportTab datasetId={dataset.id} />
        </TabsContent>
        <TabsContent value="aliases" className="mt-0">
          <DataReviewQueueTab datasetId={dataset.id} />
        </TabsContent>
        <TabsContent value="related" className="mt-0">
          <RelatedDatasetsTab datasetId={dataset.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
