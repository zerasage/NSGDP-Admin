"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  CheckCircle2,
  Database,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/feedback/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HelpTip } from "@/components/admin/help-tip";
import { DataTableShell, MetricCard, Panel } from "@/components/admin/admin-analytics-ui";
import {
  useConflictDatasetSummaries,
  useConflictPeriodOptions,
  useObservationConflicts,
  useResolveObservationConflicts,
  useStaleResolvedConflictSummary,
  useStaleResolvedConflicts,
} from "@/lib/hooks/useIngestionOps";
import type {
  ConflictPeriodOption,
  ConflictPrecedence,
  ObservationConflictRow,
  StaleResolvedConflictRow,
} from "@/lib/api/ingestion-ops";
import {
  CONFLICTS_PERIOD_TIP,
  CONFLICTS_RESOLVE_TIPS,
  CONFLICTS_STORED_TIP,
  CONFLICTS_TAB_TIP,
  CONFLICTS_UPLOAD_TIP,
} from "@/lib/constants/ingestion-ops-tooltips";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

type PeriodFilter = {
  periodYear?: number;
  periodMonth?: number;
  periodQuarter?: number;
};

function periodOptionKey(option: ConflictPeriodOption): string {
  if (option.periodMonth != null) {
    return `m:${option.periodYear}:${option.periodMonth}`;
  }
  if (option.periodQuarter != null) {
    return `q:${option.periodYear}:${option.periodQuarter}`;
  }
  return `y:${option.periodYear}`;
}

function parsePeriodFromSearchParams(params: URLSearchParams): PeriodFilter {
  const periodYear = params.get("periodYear");
  if (!periodYear) return {};
  const filter: PeriodFilter = { periodYear: Number(periodYear) };
  const periodMonth = params.get("periodMonth");
  const periodQuarter = params.get("periodQuarter");
  if (periodMonth) filter.periodMonth = Number(periodMonth);
  if (periodQuarter) filter.periodQuarter = Number(periodQuarter);
  return filter;
}

function periodFilterToSearchParams(
  filter: PeriodFilter,
  params: URLSearchParams
): void {
  params.delete("periodYear");
  params.delete("periodMonth");
  params.delete("periodQuarter");
  if (filter.periodYear != null) {
    params.set("periodYear", String(filter.periodYear));
    if (filter.periodMonth != null) {
      params.set("periodMonth", String(filter.periodMonth));
    }
    if (filter.periodQuarter != null) {
      params.set("periodQuarter", String(filter.periodQuarter));
    }
  }
}

function periodFilterKey(filter: PeriodFilter): string {
  if (filter.periodYear == null) return "all";
  if (filter.periodMonth != null) {
    return `m:${filter.periodYear}:${filter.periodMonth}`;
  }
  if (filter.periodQuarter != null) {
    return `q:${filter.periodYear}:${filter.periodQuarter}`;
  }
  return `y:${filter.periodYear}`;
}

function periodLabel(filter: PeriodFilter): string | null {
  if (filter.periodYear == null) return null;
  if (filter.periodMonth != null) {
    return `${filter.periodYear}-${String(filter.periodMonth).padStart(2, "0")}`;
  }
  if (filter.periodQuarter != null) {
    return `${filter.periodYear} Q${filter.periodQuarter}`;
  }
  return String(filter.periodYear);
}

function formatPeriod(row: ObservationConflictRow): string {
  if (row.periodMonth != null) {
    return `${row.periodYear}-${String(row.periodMonth).padStart(2, "0")}`;
  }
  if (row.periodQuarter != null) {
    return `${row.periodYear} Q${row.periodQuarter}`;
  }
  return String(row.periodYear);
}

function formatLocation(row: ObservationConflictRow): string {
  if (row.facilityName) return row.facilityName;
  if (row.wardName) return row.wardName;
  if (row.lgaName) return row.lgaName;
  return "—";
}

type BulkResolveTarget = {
  precedence: ConflictPrecedence;
  datasetBId: string;
  datasetTitle: string;
  count: number;
  periodLabel: string | null;
  periodFilter: PeriodFilter;
};

export function ConflictsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const datasetFromUrl = searchParams.get("datasetBId") ?? "";
  const periodFromUrl = parsePeriodFromSearchParams(searchParams);

  const [datasetBId, setDatasetBId] = useState(datasetFromUrl);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(periodFromUrl);
  const [page, setPage] = useState(1);
  const [bulkTarget, setBulkTarget] = useState<BulkResolveTarget | null>(null);

  const summaries = useConflictDatasetSummaries();
  const periods = useConflictPeriodOptions(datasetBId || undefined);
  const conflicts = useObservationConflicts({
    datasetBId: datasetBId || undefined,
    ...periodFilter,
    page,
    limit: PAGE_SIZE,
  });
  const resolveMutation = useResolveObservationConflicts();
  const staleSummary = useStaleResolvedConflictSummary();
  const staleConflicts = useStaleResolvedConflicts(1, {
    enabled: (staleSummary.data?.staleResolvedCount ?? 0) > 0,
  });

  useEffect(() => {
    setDatasetBId(datasetFromUrl);
    setPeriodFilter(periodFromUrl);
    setPage(1);
  }, [datasetFromUrl, searchParams]);

  const datasets = summaries.data ?? [];
  const periodOptions = periods.data ?? [];
  const selectedSummary = useMemo(
    () => datasets.find((d) => d.datasetId === datasetBId),
    [datasets, datasetBId]
  );
  const filteredCount = conflicts.data?.meta.total ?? 0;
  const sampleRow = conflicts.data?.data[0];
  const datasetSelectLabel = useMemo(() => {
    if (!datasetBId) return "All datasets";
    return (
      selectedSummary?.title ??
      sampleRow?.datasetBTitle ??
      "Loading dataset…"
    );
  }, [datasetBId, selectedSummary, sampleRow]);
  const periodSelectLabel = periodLabel(periodFilter) ?? "All periods";
  const warehouseSourceLabel =
    sampleRow?.datasetATitle ?? "dataset already in storage";
  const uploadSourceLabel =
    selectedSummary?.title ?? sampleRow?.datasetBTitle ?? "selected upload";
  const totalOpen = useMemo(
    () => datasets.reduce((sum, d) => sum + d.openConflicts, 0),
    [datasets]
  );

  const syncUrl = (nextDataset: string, nextPeriod: PeriodFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "conflicts");
    if (nextDataset) params.set("datasetBId", nextDataset);
    else params.delete("datasetBId");
    periodFilterToSearchParams(nextPeriod, params);
    const qs = params.toString();
    router.replace(qs ? `/ingestion-ops?${qs}` : "/ingestion-ops?tab=conflicts");
  };

  const setDatasetFilter = (value: string) => {
    const next = value === "all" ? "" : value;
    setDatasetBId(next);
    setPeriodFilter({});
    setPage(1);
    syncUrl(next, {});
  };

  const setPeriodSelect = (value: string) => {
    const next: PeriodFilter =
      value === "all"
        ? {}
        : (() => {
            const option = periodOptions.find((p) => periodOptionKey(p) === value);
            if (!option) return {};
            return {
              periodYear: option.periodYear,
              periodMonth: option.periodMonth ?? undefined,
              periodQuarter: option.periodQuarter ?? undefined,
            };
          })();
    setPeriodFilter(next);
    setPage(1);
    syncUrl(datasetBId, next);
  };

  const resolveOne = (conflictId: string, precedence: ConflictPrecedence) => {
    resolveMutation.mutate(
      { conflictIds: [conflictId], precedence },
      {
        onSuccess: (result) =>
          toast.success(
            result.resolved === 1
              ? "Conflict resolved"
              : `${result.resolved} conflicts resolved`
          ),
        onError: (error: unknown) =>
          toast.error(error instanceof Error ? error.message : "Failed to resolve"),
      }
    );
  };

  const resolveBulk = () => {
    if (!bulkTarget) return;
    resolveMutation.mutate(
      {
        datasetBId: bulkTarget.datasetBId,
        precedence: bulkTarget.precedence,
        ...bulkTarget.periodFilter,
      },
      {
        onSuccess: (result) => {
          toast.success(`Resolved ${result.resolved.toLocaleString()} conflict(s)`);
          setBulkTarget(null);
          setPage(1);
        },
        onError: (error: unknown) =>
          toast.error(error instanceof Error ? error.message : "Failed to resolve"),
      }
    );
  };

  if (summaries.isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (datasets.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No open conflicts"
        description="Ingested datasets currently agree with warehouse data on all shared keys."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Datasets with conflicts"
          value={datasets.length}
          icon={Database}
          tone="warning"
        />
        <MetricCard
          label="Open observation keys"
          value={totalOpen.toLocaleString()}
          icon={ShieldAlert}
          tone="destructive"
        />
        <MetricCard
          label="In current filter"
          value={filteredCount.toLocaleString()}
          hint={
            periodLabel(periodFilter)
              ? `${periodLabel(periodFilter)}${datasetBId ? "" : " · all datasets"}`
              : datasetBId
                ? selectedSummary?.title
                : "All datasets"
          }
          icon={ArrowLeftRight}
          tone="info"
        />
      </div>

      {(staleSummary.data?.staleResolvedCount ?? 0) > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">
            {staleSummary.data!.staleResolvedCount.toLocaleString()} stale resolved conflict
            {staleSummary.data!.staleResolvedCount === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-muted-foreground">
            These audit rows remain on record, but the winning dataset was archived or retracted so
            they no longer drive portal analytics.
          </p>
          {staleConflicts.data && staleConflicts.data.data.length > 0 ? (
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {(staleConflicts.data.data as StaleResolvedConflictRow[])
                .slice(0, 5)
                .map((row) => (
                <li key={row.id}>
                  <span className="font-medium text-foreground">{row.indicatorName}</span>
                  {" · "}
                  {formatPeriod(row)}
                  {" · "}
                  {row.staleReason}
                  {" · "}
                  winner: {row.precedenceDatasetTitle}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">How to choose:</span> filters only narrow
          which rows you see. When you resolve, you pick which{" "}
          <span className="font-medium text-foreground">column value</span> wins — the number in
          the <span className="font-medium text-foreground">Stored</span> column or the{" "}
          <span className="font-medium text-foreground">Upload</span> column. That choice updates
          analytics and clears the block on warehouse load for that cell.
        </p>
        {datasetBId && sampleRow ? (
          <p className="mt-2">
            For this filter:{" "}
            <span className="font-medium text-foreground">Use stored</span> keeps values from{" "}
            <span className="font-medium text-foreground">{warehouseSourceLabel}</span> (Stored
            column).{" "}
            <span className="font-medium text-foreground">Use upload</span> keeps values from{" "}
            <span className="font-medium text-foreground">{uploadSourceLabel}</span> (Upload
            column).
          </p>
        ) : (
          <p className="mt-2">
            Select an incoming upload to see which datasets each column refers to. Stored is
            usually an older dataset already in analytics; Upload is the newer file that clashed.
          </p>
        )}
      </div>

      <Panel
        title="Conflict queue"
        titleTip={CONFLICTS_TAB_TIP}
        description="Filter by incoming dataset and period, then resolve row-by-row or in bulk for that slice."
        icon={ShieldAlert}
        tone="destructive"
        action={
          datasetBId && selectedSummary && filteredCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={resolveMutation.isPending}
                title={CONFLICTS_RESOLVE_TIPS.stored}
                onClick={() =>
                  setBulkTarget({
                    precedence: "warehouse",
                    datasetBId,
                    datasetTitle: selectedSummary.title,
                    count: filteredCount,
                    periodLabel: periodLabel(periodFilter),
                    periodFilter,
                  })
                }
              >
                Use stored column
                {periodLabel(periodFilter) ? ` · ${periodLabel(periodFilter)}` : ""}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={resolveMutation.isPending}
                title={CONFLICTS_RESOLVE_TIPS.upload}
                onClick={() =>
                  setBulkTarget({
                    precedence: "incoming",
                    datasetBId,
                    datasetTitle: selectedSummary.title,
                    count: filteredCount,
                    periodLabel: periodLabel(periodFilter),
                    periodFilter,
                  })
                }
              >
                Use upload column
                {periodLabel(periodFilter) ? ` · ${periodLabel(periodFilter)}` : ""}
              </Button>
            </div>
          ) : null
        }
      >
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="min-w-0">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              Upload in conflict
              <HelpTip content={CONFLICTS_UPLOAD_TIP} />
            </label>
            <Select
              value={datasetBId || "all"}
              onValueChange={(v) => v && setDatasetFilter(v)}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="All datasets">
                  {datasetSelectLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="!w-auto min-w-[max(var(--anchor-width),20rem)] max-w-[min(36rem,calc(100vw-2rem))]"
              >
                <SelectItem
                  value="all"
                  className="items-start py-2 pr-10 **:whitespace-normal"
                >
                  <span className="flex flex-col gap-0.5 text-left">
                    <span className="font-medium leading-snug">All datasets</span>
                    <span className="text-xs text-muted-foreground">
                      {totalOpen.toLocaleString()} open keys
                    </span>
                  </span>
                </SelectItem>
                {datasets.map((d) => (
                  <SelectItem
                    key={d.datasetId}
                    value={d.datasetId}
                    className="items-start py-2 pr-10 **:whitespace-normal"
                  >
                    <span className="flex flex-col gap-0.5 text-left">
                      <span className="font-medium leading-snug">{d.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {d.openConflicts.toLocaleString()} keys · {d.slug}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              Period
              <HelpTip content={CONFLICTS_PERIOD_TIP} />
            </label>
            <Select
              value={periodFilterKey(periodFilter)}
              onValueChange={(v) => v && setPeriodSelect(v)}
              disabled={periods.isLoading}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="All periods">
                  {periodSelectLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="!w-auto min-w-[max(var(--anchor-width),12rem)] max-w-[min(24rem,calc(100vw-2rem))]"
              >
                <SelectItem
                  value="all"
                  className="items-start py-2 pr-10 **:whitespace-normal"
                >
                  <span className="font-medium leading-snug">All periods</span>
                </SelectItem>
                {periodOptions.map((p) => (
                  <SelectItem
                    key={periodOptionKey(p)}
                    value={periodOptionKey(p)}
                    className="items-start py-2 pr-10 **:whitespace-normal"
                  >
                    <span className="flex w-full items-center justify-between gap-3 text-left">
                      <span className="font-medium leading-snug">{p.label}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {p.openConflicts.toLocaleString()}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {selectedSummary ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{selectedSummary.ingestionStatus ?? "unknown"}</Badge>
              {selectedSummary.analyticsPublished ? (
                <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                  Analytics loaded
                </Badge>
              ) : (
                <Badge variant="outline">Not in warehouse</Badge>
              )}
              <Link
                href={`/datasets/${selectedSummary.slug}`}
                className="font-medium text-primary hover:underline"
              >
                Open dataset
              </Link>
            </div>
        ) : null}

        {conflicts.isLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : !conflicts.data || conflicts.data.data.length === 0 ? (
          <EmptyState title="No conflicts in this view" />
        ) : (
          <>
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicator</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">
                      <span className="inline-flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center gap-1">
                          Stored
                          <HelpTip content={CONFLICTS_STORED_TIP} />
                        </span>
                        {sampleRow ? (
                          <span className="max-w-[8rem] truncate text-[10px] font-normal text-muted-foreground">
                            {sampleRow.datasetATitle}
                          </span>
                        ) : null}
                      </span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="inline-flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center gap-1">
                          Upload
                          <HelpTip content={CONFLICTS_UPLOAD_TIP} />
                        </span>
                        {sampleRow ? (
                          <span className="max-w-[8rem] truncate text-[10px] font-normal text-muted-foreground">
                            {sampleRow.datasetBTitle}
                          </span>
                        ) : null}
                      </span>
                    </TableHead>
                    <TableHead>Sources</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.data.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="max-w-[180px]">
                        <p className="truncate font-medium">{row.indicatorName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.indicatorSlug}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm">
                        {formatLocation(row)}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {formatPeriod(row)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {row.valueA ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-sm tabular-nums",
                          row.valueA !== row.valueB && "font-semibold text-destructive"
                        )}
                      >
                        {row.valueB ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                        <p className="truncate" title={row.datasetATitle}>
                          A: {row.datasetATitle}
                        </p>
                        <p className="truncate" title={row.datasetBTitle}>
                          B: {row.datasetBTitle}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            disabled={resolveMutation.isPending}
                            title={`Keep stored value (${row.datasetATitle})`}
                            onClick={() => resolveOne(row.id, "warehouse")}
                          >
                            Stored
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            disabled={resolveMutation.isPending}
                            title={`Keep upload value (${row.datasetBTitle})`}
                            onClick={() => resolveOne(row.id, "incoming")}
                          >
                            Upload
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Page {conflicts.data.meta.page} of {conflicts.data.meta.totalPages} ·{" "}
                {conflicts.data.meta.total.toLocaleString()} key(s)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!conflicts.data.meta.hasPrevPage || resolveMutation.isPending}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!conflicts.data.meta.hasNextPage || resolveMutation.isPending}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Panel>

      <p className="text-xs text-muted-foreground">
        Resolving records your precedence choice; warehouse cells are not rewritten automatically.
      </p>

      <ConfirmDialog
        open={!!bulkTarget}
        onOpenChange={(open) => !open && setBulkTarget(null)}
        title={
          bulkTarget?.periodLabel
            ? `Resolve conflicts for ${bulkTarget.periodLabel}?`
            : "Resolve all conflicts for this filter?"
        }
        description={
          bulkTarget
            ? `Mark ${bulkTarget.count.toLocaleString()} row(s) for “${bulkTarget.datasetTitle}”${
                bulkTarget.periodLabel ? ` in ${bulkTarget.periodLabel}` : ""
              } as resolved, using ${
                bulkTarget.precedence === "warehouse"
                  ? "the Stored column values (already in analytics)."
                  : "the Upload column values (from that upload)."
              }`
            : ""
        }
        confirmLabel="Resolve all"
        loading={resolveMutation.isPending}
        onConfirm={resolveBulk}
      />
    </div>
  );
}
