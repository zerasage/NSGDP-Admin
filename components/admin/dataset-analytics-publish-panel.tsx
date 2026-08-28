"use client";

import { Activity, Globe, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AnalyticsPipelineStrip } from "@/components/admin/analytics-pipeline-strip";
import { publishDataset, publishDatasetAnalytics, unpublishDataset } from "@/lib/api/admin";
import { useAnalyticsPublishStatus } from "@/lib/hooks/useIngestionReview";
import { toast } from "sonner";

interface DatasetAnalyticsPublishPanelProps {
  slug: string;
  datasetId: string;
  format: string;
  status: string;
  publishedAt: string | null;
  analyticsPublishedAt: string | null;
  canPublish: boolean;
  /** Catalogue publish/unpublish — dataset detail page only. */
  showCatalogueControls?: boolean;
}

export function DatasetAnalyticsPublishPanel({
  slug,
  datasetId,
  format,
  status,
  publishedAt,
  analyticsPublishedAt,
  canPublish,
  showCatalogueControls = true,
}: DatasetAnalyticsPublishPanelProps) {
  const queryClient = useQueryClient();
  const isTabular = format === "csv" || format === "excel";
  const { data: analyticsPublishStatus } = useAnalyticsPublishStatus(
    isTabular ? datasetId : undefined,
  );

  const publishMutation = useMutation({
    mutationFn: () => publishDataset(slug),
    onSuccess: () => {
      toast.success(
        "Published to catalogue — analytics loads automatically when aliases are clear.",
      );
      queryClient.invalidateQueries({ queryKey: ["dataset", slug] });
      queryClient.invalidateQueries({ queryKey: ["analytics-publish-status"] });
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to publish dataset",
      ),
  });

  const loadAnalyticsMutation = useMutation({
    mutationFn: () => publishDatasetAnalytics(slug),
    onSuccess: () => {
      toast.success("Analytics load started — this page will update automatically.");
      queryClient.invalidateQueries({ queryKey: ["dataset", slug] });
      queryClient.invalidateQueries({ queryKey: ["analytics-publish-status"] });
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to load analytics",
      ),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishDataset(slug),
    onSuccess: () => {
      toast.success("Dataset unpublished from the catalogue");
      queryClient.invalidateQueries({ queryKey: ["dataset", slug] });
      queryClient.invalidateQueries({ queryKey: ["analytics-publish-status"] });
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to unpublish dataset",
      ),
  });

  if (!isTabular || !analyticsPublishStatus) return null;
  if (analyticsPublishStatus.phase === "not_applicable") return null;

  const analyticsPhase = analyticsPublishStatus.phase;
  const showLoadAnalytics =
    canPublish &&
    (analyticsPhase === "ready" ||
      analyticsPhase === "failed" ||
      (analyticsPublishStatus.workerHint &&
        (analyticsPhase === "loading" || analyticsPhase === "updating")));
  const showActionRow =
    canPublish &&
    status === "approved" &&
    (showCatalogueControls || showLoadAnalytics);

  return (
    <div className="space-y-3">
      <AnalyticsPipelineStrip status={analyticsPublishStatus} />
      {showActionRow ? (
        <div className="flex flex-wrap gap-2">
          {showCatalogueControls ? (
            !publishedAt ? (
              <Button
                size="sm"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="gap-1.5"
              >
                {publishMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Globe className="size-4" aria-hidden />
                )}
                Publish to catalogue
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => unpublishMutation.mutate()}
                disabled={unpublishMutation.isPending}
                className="gap-1.5"
              >
                <Globe className="size-4" aria-hidden />
                Unpublish
              </Button>
            )
          ) : null}
          {showLoadAnalytics ? (
            <Button
              size="sm"
              variant={analyticsPhase === "failed" ? "default" : "outline"}
              onClick={() => loadAnalyticsMutation.mutate()}
              disabled={loadAnalyticsMutation.isPending}
              className="gap-1.5"
            >
              {loadAnalyticsMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Activity className="size-4" aria-hidden />
              )}
              {analyticsPhase === "failed"
                ? "Retry analytics load"
                : "Load analytics"}
            </Button>
          ) : null}
          {analyticsPublishedAt &&
          (analyticsPhase === "loading" || analyticsPhase === "updating") ? (
            <p className="self-center text-xs text-muted-foreground">
              Warehouse load in progress…
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
