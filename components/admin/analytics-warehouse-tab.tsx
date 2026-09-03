"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Database,
  ExternalLink,
  Loader2,
  Undo2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MetricCard,
  Panel,
  DataTableShell,
} from "@/components/admin/admin-analytics-ui";
import { HelpTip } from "@/components/admin/help-tip";
import {
  WAREHOUSE_FILTER_TIPS,
  WAREHOUSE_METRIC_TIPS,
} from "@/lib/constants/ingestion-ops-tooltips";
import {
  invalidateDatasetWorkspace,
  useAnalyticsWarehouse,
} from "@/lib/hooks/useIngestionReview";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import type { AnalyticsWarehouseFilter } from "@/lib/api/ingestion-review";
import {
  publishDatasetAnalytics,
  retractDataset,
} from "@/lib/api/admin";
import {
  INGESTION_STATUS_LABEL,
  type IngestionStatus,
} from "@/lib/utils/ingestion-status";
import { formatDate } from "@/lib/utils/date";
import { publicAnalyticsMessage } from "@/lib/utils/analytics-publish-ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS: {
  value: AnalyticsWarehouseFilter;
  label: string;
  tip: string;
}[] = [
  {
    value: "in_warehouse",
    label: "In warehouse",
    tip: WAREHOUSE_FILTER_TIPS.in_warehouse,
  },
  { value: "loading", label: "Loading", tip: WAREHOUSE_FILTER_TIPS.loading },
  {
    value: "ready",
    label: "Ready to load",
    tip: WAREHOUSE_FILTER_TIPS.ready,
  },
  { value: "all", label: "All eligible", tip: WAREHOUSE_FILTER_TIPS.all },
];

function phaseLabel(
  phase: string,
  ingestionStatus: string,
  publicationStatus: string | null,
): string {
  if (
    ingestionStatus === "retracting" ||
    publicationStatus === "retracting"
  ) {
    return "Retracting";
  }
  if (publicationStatus === "publishing") {
    return phase === "updating" ? "Updating" : "Loading";
  }
  switch (phase) {
    case "loaded":
      return "In warehouse";
    case "loading":
    case "updating":
      return "Loading";
    case "ready":
      return "Ready to load";
    case "retracting":
      return "Retracting";
    case "failed":
      return "Failed";
    default:
      return "Blocked";
  }
}

function phaseBadgeClass(phase: string): string {
  switch (phase) {
    case "loaded":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "loading":
    case "updating":
    case "retracting":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "ready":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
    case "failed":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    default:
      return "";
  }
}

function orgLabel(name: string | null, acronym: string | null): string {
  if (acronym && name) return `${acronym} — ${name}`;
  return name ?? acronym ?? "—";
}

export function AnalyticsWarehouseTab() {
  const [filter, setFilter] = useState<AnalyticsWarehouseFilter>("in_warehouse");
  const [retractTarget, setRetractTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const { can } = useAdminAccess();
  const canPublish = can("publish:datasets");
  const queryClient = useQueryClient();

  const warehouseQuery = useAnalyticsWarehouse(filter);
  const { data, isLoading } = warehouseQuery;

  const invalidateWarehouse = () => {
    invalidateDatasetWorkspace(queryClient);
  };

  const loadMutation = useMutation({
    mutationFn: (slug: string) => publishDatasetAnalytics(slug),
    onSuccess: () => {
      toast.success("Analytics load started");
      invalidateWarehouse();
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to load analytics",
      ),
  });

  const retractMutation = useMutation({
    mutationFn: (datasetId: string) =>
      retractDataset(datasetId, {
        reason: "Retracted from ingestion ops warehouse",
      }),
    onSuccess: () => {
      toast.success(
        "Retraction started — warehouse rows will be removed shortly",
      );
      setRetractTarget(null);
      invalidateWarehouse();
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to retract dataset",
      ),
  });

  const warehouseSummary = warehouseQuery.data?.summary;

  return (
    <div className="space-y-4">
      {warehouseSummary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="In warehouse"
            value={warehouseSummary.inWarehouse}
            tip={WAREHOUSE_METRIC_TIPS.in_warehouse}
            icon={Database}
            tone="success"
          />
          <MetricCard
            label="Ready to load"
            value={warehouseSummary.readyToLoad}
            tip={WAREHOUSE_METRIC_TIPS.ready_to_load}
            icon={Activity}
            tone="warning"
          />
          <MetricCard
            label="Loading now"
            value={warehouseSummary.loading}
            tip={WAREHOUSE_METRIC_TIPS.loading_now}
            icon={Loader2}
            tone="info"
          />
          <MetricCard
            label="Failed loads"
            value={warehouseSummary.failed}
            tip={WAREHOUSE_METRIC_TIPS.failed_loads}
            icon={Activity}
            tone="destructive"
          />
        </div>
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : null}

      <Panel
        title="Analytics warehouse"
        titleTip={WAREHOUSE_FILTER_TIPS[filter]}
        description="Datasets whose resolved observations feed public analytics (disease_burden). Load new sources or retract rows from here."
        icon={Database}
        tone="success"
        action={
          <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
            {FILTER_OPTIONS.map((opt) => (
              <div key={opt.value} className="inline-flex items-center gap-0.5">
                <Button
                  size="sm"
                  variant={filter === opt.value ? "secondary" : "ghost"}
                  className="h-8"
                  onClick={() => setFilter(opt.value)}
                >
                  {opt.label}
                </Button>
                <HelpTip content={opt.tip} label={`About ${opt.label}`} />
              </div>
            ))}
          </div>
        }
      >
        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : !warehouseQuery.data?.items.length ? (
          <EmptyState
            title={
              filter === "ready"
                ? "No datasets ready to load"
                : filter === "loading"
                  ? "No analytics loads in progress"
                  : "No warehouse sources"
            }
            description={
              filter === "ready"
                ? "Approved catalogue datasets with cleared aliases and finished ingestion appear here when they are waiting for an analytics load."
                : filter === "loading"
                  ? "When a warehouse publish job is running, the dataset appears here with a Loading status."
                  : "When datasets finish ingestion and load into analytics, they appear in this list."
            }
          />
        ) : (
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Burden rows</TableHead>
                  <TableHead className="text-right">Indicators</TableHead>
                  <TableHead>Loaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouseQuery.data.items.map((row) => {
                  const lastError = publicAnalyticsMessage(row.lastError);
                  const showLoad = canPublish && row.canLoad;
                  const showRetract = canPublish && row.canRetract;
                  const isBusy =
                    row.phase === "loading" ||
                    row.phase === "updating" ||
                    row.phase === "retracting" ||
                    row.ingestionStatus === "retracting" ||
                    row.publicationStatus === "publishing" ||
                    row.publicationStatus === "retracting";

                  return (
                    <TableRow key={row.datasetId}>
                      <TableCell>
                        <div className="space-y-1">
                          <Link
                            href={`/datasets/${row.slug}`}
                            className="font-medium hover:underline"
                          >
                            {row.title}
                          </Link>
                          {lastError ? (
                            <p className="max-w-xs truncate text-xs text-destructive">
                              {lastError}
                            </p>
                          ) : row.openConflicts > 0 ? (
                            <p className="max-w-xs truncate text-xs text-amber-800 dark:text-amber-200">
                              {row.openConflicts.toLocaleString()} clash
                              {row.openConflicts === 1 ? "" : "es"} — charts keep
                              stored values
                            </p>
                          ) : row.phase === "ready" && row.publishableRows > 0 ? (
                            <p className="max-w-xs truncate text-xs text-muted-foreground">
                              {row.publishableRows.toLocaleString()} rows ready
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {orgLabel(
                          row.organisationName,
                          row.organisationAcronym,
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={cn("w-fit", phaseBadgeClass(row.phase))}
                          >
                            {isBusy ? (
                              <Loader2 className="mr-1 size-3 animate-spin" />
                            ) : null}
                            {phaseLabel(
                              row.phase,
                              row.ingestionStatus,
                              row.publicationStatus,
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {INGESTION_STATUS_LABEL[
                              row.ingestionStatus as IngestionStatus
                            ] ?? row.ingestionStatus}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.burdenRowCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.indicatorCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.analyticsPublishedAt
                          ? formatDate(row.analyticsPublishedAt)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/datasets/${row.slug}`}
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <ExternalLink className="size-3.5" />
                            <span className="sr-only">Open dataset</span>
                          </Link>
                          {showLoad ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loadMutation.isPending}
                              onClick={() => loadMutation.mutate(row.slug)}
                            >
                              {row.phase === "failed" ? "Retry" : "Load"}
                            </Button>
                          ) : null}
                          {showRetract ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setRetractTarget({
                                  id: row.datasetId,
                                  title: row.title,
                                })
                              }
                            >
                              <Undo2 className="size-3.5" />
                              <span className="sr-only">Retract</span>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataTableShell>
        )}
        {data && data.total > data.items.length ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing {data.items.length} of {data.total} datasets.
          </p>
        ) : null}
      </Panel>

      <ConfirmDialog
        open={!!retractTarget}
        onOpenChange={(open) => !open && setRetractTarget(null)}
        title="Retract analytics load?"
        description={`Remove ${retractTarget?.title ?? "this dataset"} from the analytics warehouse. The catalogue file stays — public charts drop its rows until you reload.`}
        confirmLabel="Retract analytics"
        variant="destructive"
        loading={retractMutation.isPending}
        onConfirm={() => {
          if (retractTarget) retractMutation.mutate(retractTarget.id);
        }}
      />
    </div>
  );
}
