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
  useConflictLocationOptions,
  useConflictPeriodOptions,
  useConflictSourceOptions,
  useObservationConflictCells,
  useResolveObservationConflicts,
  useStaleResolvedConflictSummary,
  useStaleResolvedConflicts,
} from "@/lib/hooks/useIngestionOps";
import type {
  ConflictCell,
  ConflictPeriodOption,
  ConflictPrecedence,
  ConflictSourceOption,
  StaleResolvedConflictRow,
} from "@/lib/api/ingestion-ops";
import {
  CONFLICTS_LOCATION_TIP,
  CONFLICTS_PERIOD_TIP,
  CONFLICTS_PERIOD_WINNER_TIP,
  CONFLICTS_RESOLVE_TIPS,
  CONFLICTS_TAB_TIP,
  CONFLICTS_UPLOAD_TIP,
} from "@/lib/constants/ingestion-ops-tooltips";
import { toast } from "sonner";

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

function formatPeriod(row: {
  periodYear: number;
  periodMonth: number | null;
  periodQuarter: number | null;
}): string {
  if (row.periodMonth != null) {
    return `${row.periodYear}-${String(row.periodMonth).padStart(2, "0")}`;
  }
  if (row.periodQuarter != null) {
    return `${row.periodYear} Q${row.periodQuarter}`;
  }
  return String(row.periodYear);
}

function formatLocation(row: {
  facilityName: string | null;
  wardName: string | null;
  lgaName: string | null;
}): string {
  if (row.facilityName) return row.facilityName;
  if (row.wardName) return row.wardName;
  if (row.lgaName) return row.lgaName;
  return "—";
}

type BulkResolveTarget =
  | {
      kind: "precedence";
      precedence: ConflictPrecedence;
      datasetBId: string;
      datasetTitle: string;
      count: number;
      periodLabel: string | null;
      periodFilter: PeriodFilter;
      lgaId?: string;
    }
  | {
      kind: "winner";
      winnerDatasetId: string;
      datasetTitle: string;
      count: number;
      scopeLabel: string;
      periodFilter: PeriodFilter;
      datasetBId?: string;
      lgaId?: string;
    };

export function ConflictsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const datasetFromUrl = searchParams.get("datasetBId") ?? "";
  const lgaFromUrl = searchParams.get("lgaId") ?? "";
  const periodFromUrl = parsePeriodFromSearchParams(searchParams);

  const [datasetBId, setDatasetBId] = useState(datasetFromUrl);
  const [lgaId, setLgaId] = useState(lgaFromUrl);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(periodFromUrl);
  const [page, setPage] = useState(1);
  const [bulkTarget, setBulkTarget] = useState<BulkResolveTarget | null>(null);
  const [periodWinnerId, setPeriodWinnerId] = useState("");

  const summaries = useConflictDatasetSummaries();
  const periods = useConflictPeriodOptions(
    datasetBId || undefined,
    lgaId || undefined
  );
  const locations = useConflictLocationOptions({
    datasetBId: datasetBId || undefined,
    ...periodFilter,
  });
  const sources = useConflictSourceOptions({
    periodYear: periodFilter.periodYear,
    periodMonth: periodFilter.periodMonth,
    periodQuarter: periodFilter.periodQuarter,
    datasetBId: datasetBId || undefined,
    lgaId: lgaId || undefined,
  });
  const cells = useObservationConflictCells({
    datasetBId: datasetBId || undefined,
    ...periodFilter,
    lgaId: lgaId || undefined,
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
    setLgaId(lgaFromUrl);
    setPeriodFilter(periodFromUrl);
    setPage(1);
  }, [datasetFromUrl, lgaFromUrl, searchParams]);

  const datasets = summaries.data ?? [];
  const periodOptions = periods.data ?? [];
  const locationOptions = locations.data ?? [];
  const sourceOptions = sources.data ?? [];
  const selectedSummary = useMemo(
    () => datasets.find((d) => d.datasetId === datasetBId),
    [datasets, datasetBId]
  );
  const selectedLocation = useMemo(
    () => locationOptions.find((l) => l.lgaId === lgaId),
    [locationOptions, lgaId]
  );
  const selectedPeriodWinner = useMemo(
    () => sourceOptions.find((d) => d.datasetId === periodWinnerId),
    [sourceOptions, periodWinnerId]
  );

  useEffect(() => {
    if (datasetBId) setPeriodWinnerId(datasetBId);
  }, [datasetBId]);

  useEffect(() => {
    if (!lgaId || locationOptions.length === 0) return;
    if (!locationOptions.some((l) => l.lgaId === lgaId)) {
      setLgaId("");
    }
  }, [lgaId, locationOptions]);

  useEffect(() => {
    if (!periodWinnerId || sourceOptions.length === 0) return;
    if (!sourceOptions.some((d) => d.datasetId === periodWinnerId)) {
      setPeriodWinnerId("");
    }
  }, [periodWinnerId, sourceOptions]);
  const filteredCount = cells.data?.meta.total ?? 0;
  const datasetSelectLabel = useMemo(() => {
    if (!datasetBId) return "All datasets";
    return selectedSummary?.title ?? "Loading dataset…";
  }, [datasetBId, selectedSummary]);
  const periodSelectLabel = periodLabel(periodFilter) ?? "All periods";
  const locationSelectLabel = selectedLocation?.lgaName ?? (lgaId ? "Loading location…" : "All locations");
  const winnerScopeLabel =
    [selectedSummary?.title, periodLabel(periodFilter), selectedLocation?.lgaName]
      .filter(Boolean)
      .join(" · ") || "this view";
  const showWinnerPicker =
    periodFilter.periodYear != null || Boolean(datasetBId) || Boolean(lgaId);
  const totalOpen = useMemo(
    () => datasets.reduce((sum, d) => sum + d.openConflicts, 0),
    [datasets]
  );

  const syncUrl = (
    nextDataset: string,
    nextPeriod: PeriodFilter,
    nextLgaId: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "conflicts");
    if (nextDataset) params.set("datasetBId", nextDataset);
    else params.delete("datasetBId");
    if (nextLgaId) params.set("lgaId", nextLgaId);
    else params.delete("lgaId");
    periodFilterToSearchParams(nextPeriod, params);
    const qs = params.toString();
    router.replace(qs ? `/ingestion-ops?${qs}` : "/ingestion-ops?tab=conflicts");
  };

  const setDatasetFilter = (value: string) => {
    const next = value === "all" ? "" : value;
    setDatasetBId(next);
    setPeriodWinnerId(next);
    setPage(1);
    syncUrl(next, periodFilter, lgaId);
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
    setPeriodWinnerId(datasetBId);
    setPage(1);
    syncUrl(datasetBId, next, lgaId);
  };

  const setLocationSelect = (value: string) => {
    const next = value === "all" ? "" : value;
    setLgaId(next);
    setPage(1);
    syncUrl(datasetBId, periodFilter, next);
  };

  const resolveCell = (cell: ConflictCell, winnerDatasetId: string) => {
    resolveMutation.mutate(
      { conflictIds: cell.conflictIds, winnerDatasetId },
      {
        onSuccess: (result) =>
          toast.success(
            result.resolved === 1
              ? "Winner recorded for this cell"
              : `${result.resolved} source rows resolved`
          ),
        onError: (error: unknown) =>
          toast.error(error instanceof Error ? error.message : "Failed to resolve"),
      }
    );
  };

  const resolveBulk = () => {
    if (!bulkTarget) return;
    const body =
      bulkTarget.kind === "winner"
        ? {
            winnerDatasetId: bulkTarget.winnerDatasetId,
            datasetBId: bulkTarget.datasetBId,
            lgaId: bulkTarget.lgaId,
            ...bulkTarget.periodFilter,
          }
        : {
            datasetBId: bulkTarget.datasetBId,
            precedence: bulkTarget.precedence,
            lgaId: bulkTarget.lgaId,
            ...bulkTarget.periodFilter,
          };
    resolveMutation.mutate(body, {
      onSuccess: (result) => {
        toast.success(`Resolved ${result.resolved.toLocaleString()} conflict(s)`);
        setBulkTarget(null);
        setPeriodWinnerId("");
        setPage(1);
      },
      onError: (error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Failed to resolve"),
    });
  };

  const confirmViewWinner = (source: ConflictSourceOption) => {
    if (periodFilter.periodYear == null && !datasetBId && !lgaId) return;
    setBulkTarget({
      kind: "winner",
      winnerDatasetId: source.datasetId,
      datasetTitle: source.title,
      count: source.openCells,
      scopeLabel: winnerScopeLabel,
      periodFilter,
      datasetBId: datasetBId || undefined,
      lgaId: lgaId || undefined,
    });
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
          hint={winnerScopeLabel}
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
          <span className="font-medium text-foreground">How to choose:</span> each
          row is one place, indicator, and period. Every dataset that reported a
          different number is listed. Charts keep the{" "}
          <span className="font-medium text-foreground">current analytics</span>{" "}
          value until you pick a winner.
        </p>
      </div>

      <Panel
        title="Conflict queue"
        titleTip={CONFLICTS_TAB_TIP}
        description="Each row is one cell. Pick which dataset’s number should be truth for analytics."
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
                    kind: "precedence",
                    precedence: "warehouse",
                    datasetBId,
                    datasetTitle: selectedSummary.title,
                    count: filteredCount,
                    periodLabel: periodLabel(periodFilter),
                    periodFilter,
                    lgaId: lgaId || undefined,
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
                    kind: "precedence",
                    precedence: "incoming",
                    datasetBId,
                    datasetTitle: selectedSummary.title,
                    count: filteredCount,
                    periodLabel: periodLabel(periodFilter),
                    periodFilter,
                    lgaId: lgaId || undefined,
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
        <div className="mb-4 grid gap-3 md:grid-cols-3">
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
          <div className="min-w-0">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              Location
              <HelpTip content={CONFLICTS_LOCATION_TIP} />
            </label>
            <Select
              value={lgaId || "all"}
              onValueChange={(v) => v && setLocationSelect(v)}
              disabled={locations.isLoading}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="All locations">
                  {locationSelectLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="!w-auto min-w-[max(var(--anchor-width),16rem)] max-w-[min(28rem,calc(100vw-2rem))]"
              >
                <SelectItem
                  value="all"
                  className="items-start py-2 pr-10 **:whitespace-normal"
                >
                  <span className="font-medium leading-snug">All locations</span>
                </SelectItem>
                {locationOptions.map((loc) => (
                  <SelectItem
                    key={loc.lgaId}
                    value={loc.lgaId}
                    className="items-start py-2 pr-10 **:whitespace-normal"
                  >
                    <span className="flex w-full items-center justify-between gap-3 text-left">
                      <span className="font-medium leading-snug">{loc.lgaName}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {loc.openCells.toLocaleString()}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {showWinnerPicker ? (
          <div className="mb-4 rounded-xl border border-border/80 bg-muted/20 px-3 py-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[16rem] flex-1">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  Winner for {winnerScopeLabel}
                  <HelpTip content={CONFLICTS_PERIOD_WINNER_TIP} />
                </label>
                {sources.isLoading ? (
                  <Skeleton className="h-10 w-full rounded-md" />
                ) : sourceOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reporting datasets in this period.
                  </p>
                ) : (
                  <Select
                    value={periodWinnerId || "none"}
                    onValueChange={(v) =>
                      setPeriodWinnerId(!v || v === "none" ? "" : v)
                    }
                  >
                    <SelectTrigger className="h-10 w-full min-w-0">
                      <SelectValue placeholder="Choose a dataset">
                        {selectedPeriodWinner?.title ?? "Choose a dataset"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      alignItemWithTrigger={false}
                      className="!w-auto min-w-[max(var(--anchor-width),20rem)] max-w-[min(36rem,calc(100vw-2rem))]"
                    >
                      <SelectItem
                        value="none"
                        className="items-start py-2 pr-10 **:whitespace-normal"
                      >
                        <span className="font-medium leading-snug">
                          Choose a dataset
                        </span>
                      </SelectItem>
                      {sourceOptions.map((source) => (
                        <SelectItem
                          key={source.datasetId}
                          value={source.datasetId}
                          className="items-start py-2 pr-10 **:whitespace-normal"
                        >
                          <span className="flex flex-col gap-0.5 text-left">
                            <span className="font-medium leading-snug">
                              {source.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {source.openCells.toLocaleString()} cell
                              {source.openCells === 1 ? "" : "s"} · {source.slug}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button
                size="sm"
                disabled={
                  !selectedPeriodWinner ||
                  selectedPeriodWinner.openCells === 0 ||
                  resolveMutation.isPending
                }
                onClick={() =>
                  selectedPeriodWinner && confirmViewWinner(selectedPeriodWinner)
                }
              >
                Use as winner
                {winnerScopeLabel !== "this view" ? ` · ${winnerScopeLabel}` : ""}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Each cell keeps that dataset’s own number. Cells it did not report stay
              unchanged.
            </p>
          </div>
        ) : null}
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

        {cells.isLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : !cells.data || cells.data.data.length === 0 ? (
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
                    <TableHead>Reported values</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cells.data.data.map((cell) => (
                    <TableRow key={cell.cellKey}>
                      <TableCell className="max-w-[180px] align-top">
                        <p className="truncate font-medium">{cell.indicatorName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {cell.indicatorSlug}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate align-top text-sm">
                        {formatLocation(cell)}
                      </TableCell>
                      <TableCell className="align-top tabular-nums text-sm">
                        {formatPeriod(cell)}
                      </TableCell>
                      <TableCell>
                        <ul className="space-y-2">
                          {cell.candidates.map((candidate) => (
                            <li
                              key={candidate.datasetId}
                              className="flex flex-wrap items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {candidate.title}
                                </p>
                                <p className="font-mono text-sm tabular-nums">
                                  {candidate.value ?? "—"}
                                  {candidate.isLiveWarehouse ? (
                                    <span className="ml-2 text-xs font-sans font-medium text-emerald-700 dark:text-emerald-300">
                                      current analytics
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant={
                                  candidate.isLiveWarehouse ? "outline" : "ghost"
                                }
                                className="h-8 px-2 text-xs"
                                disabled={
                                  resolveMutation.isPending ||
                                  candidate.isLiveWarehouse
                                }
                                title={`Use ${candidate.title} as truth for this cell`}
                                onClick={() =>
                                  resolveCell(cell, candidate.datasetId)
                                }
                              >
                                {candidate.isLiveWarehouse
                                  ? "Keeping this"
                                  : "Use this"}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Page {cells.data.meta.page} of {cells.data.meta.totalPages} ·{" "}
                {cells.data.meta.total.toLocaleString()} cell(s)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!cells.data.meta.hasPrevPage || resolveMutation.isPending}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!cells.data.meta.hasNextPage || resolveMutation.isPending}
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
        Picking a winner updates that analytics cell immediately. Unique rows from
        other datasets stay loaded.
      </p>

      <ConfirmDialog
        open={!!bulkTarget}
        onOpenChange={(open) => !open && setBulkTarget(null)}
        title={
          bulkTarget?.kind === "winner"
            ? `Use ${bulkTarget.datasetTitle} as winner for ${bulkTarget.scopeLabel}?`
            : bulkTarget?.periodLabel
              ? `Resolve conflicts for ${bulkTarget.periodLabel}?`
              : "Resolve all conflicts for this filter?"
        }
        description={
          !bulkTarget
            ? ""
            : bulkTarget.kind === "winner"
              ? `Charts will use “${bulkTarget.datasetTitle}” on ${bulkTarget.count.toLocaleString()} cell(s) in ${bulkTarget.scopeLabel}. Each cell keeps that dataset’s own value. Cells it did not report are left unchanged.`
              : `Mark ${bulkTarget.count.toLocaleString()} row(s) for “${bulkTarget.datasetTitle}”${
                  bulkTarget.periodLabel ? ` in ${bulkTarget.periodLabel}` : ""
                } as resolved, using ${
                  bulkTarget.precedence === "warehouse"
                    ? "the Stored column values (already in analytics)."
                    : "the Upload column values (from that upload)."
                }`
        }
        confirmLabel={bulkTarget?.kind === "winner" ? "Use as winner" : "Resolve all"}
        loading={resolveMutation.isPending}
        onConfirm={resolveBulk}
      />
    </div>
  );
}
