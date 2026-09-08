"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Link2, Loader2, MapPin, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { AliasDecisionDialog } from "@/components/admin/alias-decision-dialog";
import { OrgunitConfirmDialog } from "@/components/admin/orgunit-confirm-dialog";
import { AliasReviewContextPanel } from "@/components/admin/alias-review-context-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MetricCard, Panel } from "@/components/admin/admin-analytics-ui";
import { ALIASES_TAB_TIP } from "@/lib/constants/ingestion-ops-tooltips";
import { DATASET_ALIASES_TIP } from "@/lib/constants/dataset-tooltips";
import {
  useReviewQueue,
  useConfirmIndicatorAlias,
  useRejectIndicatorAlias,
  useRejectIndicatorAliases,
  useAcceptAutoMatchedAliases,
} from "@/lib/hooks/useIngestionReview";
import type {
  ReviewQueueItem,
  ReviewQueueMode,
} from "@/lib/api/ingestion-review";
import {
  detectMeasureKind,
  MEASURE_KIND_FILTERS,
  type MeasureKind,
} from "@/lib/utils/measure-kind";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DataReviewQueueTabProps {
  /** Scope to one dataset. Omit with `global` for the ops-wide queue. */
  datasetId?: string;
  global?: boolean;
  limit?: number;
}

export function DataReviewQueueTab({
  datasetId,
  global = false,
  limit,
}: DataReviewQueueTabProps) {
  const [queueMode, setQueueMode] = useState<ReviewQueueMode>("pending");
  const queueLimit = limit ?? (global ? 200 : undefined);
  const { data: items, isLoading } = useReviewQueue(datasetId, {
    global,
    limit: queueLimit,
    mode: queueMode,
  });
  const { data: otherItems } = useReviewQueue(datasetId, {
    global,
    limit: queueLimit,
    mode: queueMode === "pending" ? "auto" : "pending",
  });
  const confirmMutation = useConfirmIndicatorAlias(datasetId);
  const rejectMutation = useRejectIndicatorAlias(datasetId);
  const rejectManyMutation = useRejectIndicatorAliases(datasetId);
  const acceptAutoMutation = useAcceptAutoMatchedAliases(datasetId);
  const [deciding, setDeciding] = useState<ReviewQueueItem | null>(null);
  const [orgunitItem, setOrgunitItem] = useState<ReviewQueueItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReviewQueueItem | null>(null);
  const [acceptSelectedOpen, setAcceptSelectedOpen] = useState(false);
  const [rejectSelectedOpen, setRejectSelectedOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [kindFilter, setKindFilter] = useState<MeasureKind | "all">("all");

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (kindFilter === "all") return items;
    return items.filter((item) => {
      if (item.kind !== "indicator") return kindFilter === "cases";
      return detectMeasureKind(item.rawText).kind === kindFilter;
    });
  }, [items, kindFilter]);
  // Auto mode: tick to Accept (needs a matched indicator). Pending mode: tick
  // to bulk "not an indicator" (any indicator row qualifies).
  const selectableIds = useMemo(
    () =>
      filteredItems
        .filter(
          (item) =>
            item.kind === "indicator" &&
            (queueMode === "auto" ? Boolean(item.indicatorId) : true),
        )
        .map((item) => item.id),
    [queueMode, filteredItems],
  );

  // Ticks that no longer point at a selectable row (sub-filter changed, items
  // refetched) are ignored rather than synced away in an effect.
  const activeSelectedIds = useMemo(
    () => selectedIds.filter((id) => selectableIds.includes(id)),
    [selectedIds, selectableIds],
  );

  const handleConfirm = (indicatorId: string) => {
    if (!deciding) return;
    confirmMutation.mutate(
      { aliasId: deciding.id, indicatorId },
      {
        onSuccess: (result) => {
          toast.success(
            queueMode === "auto"
              ? `Accepted — ${result.promoted} staged row(s) kept resolved`
              : `Confirmed — ${result.promoted} staged row(s) resolved`,
          );
          setDeciding(null);
        },
        onError: (error: unknown) =>
          toast.error(error instanceof Error ? error.message : "Failed to confirm"),
      },
    );
  };

  const handleNotAnIndicatorConfirm = () => {
    if (!rejectTarget) return;
    const aliasId = rejectTarget.id;
    setRejectTarget(null);
    rejectMutation.mutate(aliasId, {
      onSuccess: (result) => {
        toast.success(
          result?.excluded
            ? `Excluded — ${result.excluded} row(s) marked as not an indicator`
            : "Marked as not an indicator",
        );
      },
      onError: (error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "Failed to mark as not an indicator",
        ),
    });
  };

  const accepting = acceptAutoMutation.isPending;
  const acceptingCount = acceptAutoMutation.variables?.length ?? 0;

  const handleAcceptSelectedAuto = () => {
    if (activeSelectedIds.length === 0 || accepting) return;
    const ids = [...activeSelectedIds];
    setAcceptSelectedOpen(false);
    acceptAutoMutation.mutate(ids, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const handleAcceptOne = (id: string) => {
    if (accepting) return;
    acceptAutoMutation.mutate([id], {
      onSuccess: () =>
        setSelectedIds((current) => current.filter((item) => item !== id)),
    });
  };

  const rejectingMany = rejectManyMutation.isPending;
  const rejectingManyCount = rejectManyMutation.variables?.length ?? 0;
  // A bulk accept/exclude in flight locks the whole list until it settles.
  const listLocked = (accepting && queueMode === "auto") || rejectingMany;

  const handleRejectSelected = () => {
    if (activeSelectedIds.length === 0 || rejectingMany) return;
    const ids = [...activeSelectedIds];
    setRejectSelectedOpen(false);
    rejectManyMutation.mutate(ids, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const allSelectableChecked =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));
  const selectedCount = activeSelectedIds.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? selectableIds : []);
  };

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const indicatorCount = (items ?? []).filter((i) => i.kind === "indicator").length;
  const orgUnitCount = (items?.length ?? 0) - indicatorCount;
  const pendingCount =
    queueMode === "pending" ? (items?.length ?? 0) : (otherItems?.length ?? 0);
  const autoCount =
    queueMode === "auto" ? (items?.length ?? 0) : (otherItems?.length ?? 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Pending aliases"
          value={pendingCount}
          icon={Link2}
          tone="warning"
        />
        <MetricCard
          label="Auto-matched to review"
          value={autoCount}
          icon={CheckCircle2}
          tone="info"
        />
        <MetricCard
          label={queueMode === "pending" ? "Org-unit strings" : "This view"}
          value={queueMode === "pending" ? orgUnitCount : indicatorCount}
          icon={MapPin}
          tone="muted"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={queueMode === "pending" ? "default" : "outline"}
          className="h-8"
          onClick={() => {
            setQueueMode("pending");
            setSelectedIds([]);
          }}
        >
          Pending ({pendingCount})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={queueMode === "auto" ? "default" : "outline"}
          className="h-8"
          onClick={() => {
            setQueueMode("auto");
            setSelectedIds([]);
          }}
        >
          Auto-matched ({autoCount})
        </Button>
        {selectableIds.length > 0 ? (
          <>
            <label className="flex h-8 items-center gap-2 rounded-md border border-input px-2.5 text-sm">
              <Checkbox
                checked={allSelectableChecked}
                disabled={accepting || rejectingMany}
                onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                aria-label={
                  queueMode === "auto"
                    ? "Mark all auto-matched in this view to accept"
                    : "Mark all indicator rows in this view to exclude"
                }
              />
              Mark all
            </label>
            {queueMode === "auto" ? (
              <Button
                type="button"
                size="sm"
                className="h-8"
                disabled={selectedCount === 0 || accepting}
                onClick={() => setAcceptSelectedOpen(true)}
              >
                {accepting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {accepting
                  ? "Accepting…"
                  : `Accept selected${
                      selectedCount > 0 ? ` (${selectedCount})` : ""
                    }`}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-muted-foreground hover:text-destructive"
                disabled={selectedCount === 0 || rejectingMany}
                onClick={() => setRejectSelectedOpen(true)}
              >
                {rejectingMany ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <XCircle className="size-4" />
                )}
                {rejectingMany
                  ? "Excluding…"
                  : `Not an indicator${
                      selectedCount > 0 ? ` (${selectedCount})` : ""
                    }`}
              </Button>
            )}
          </>
        ) : null}
      </div>

      {listLocked ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-info/30 bg-info/6 px-3 py-2 text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 shrink-0 animate-spin text-info" aria-hidden />
          <span>
            {rejectingMany
              ? `Excluding ${rejectingManyCount.toLocaleString()} label${
                  rejectingManyCount === 1 ? "" : "s"
                }`
              : `Accepting ${acceptingCount.toLocaleString()} auto-matched alias${
                  acceptingCount === 1 ? "" : "es"
                }`}
            . You can switch tabs or keep working — this list stays locked
            until it finishes.
          </span>
        </div>
      ) : null}

      {!items || items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={
            queueMode === "auto"
              ? "No auto-matches waiting"
              : "Nothing pending review"
          }
          description={
            queueMode === "auto"
              ? "Fuzzy, embed, and LLM auto-confirms that still need a human stamp will appear here."
              : global
                ? "Every pending dataset indicator and orgunit alias has been decided. GIS-only location mismatches are handled in GIS Reference."
                : "Every indicator and org-unit string in this dataset resolved automatically, or has already been decided."
          }
        />
      ) : (
        <Panel
          title={
            queueMode === "auto"
              ? global
                ? "Platform auto-matched aliases"
                : "Dataset auto-matched aliases"
              : global
                ? "Platform alias queue"
                : "Dataset alias queue"
          }
          titleTip={
            global ? ALIASES_TAB_TIP : datasetId ? DATASET_ALIASES_TIP : undefined
          }
          description={
            queueMode === "auto"
              ? "Accept a match one row at a time, or tick several and use Accept selected. Remap or Not an indicator are for matches the auto-matcher got wrong."
              : global
                ? "Confirm maps a string to a registry indicator, or create one. Mark as not an indicator for headers and layout labels. Location spellings from GIS layers are resolved in GIS Reference — only dataset orgunit aliases appear here."
                : "Resolve indicator strings for this dataset, or exclude labels that are not programme metrics. Location strings that appear in this workbook can be confirmed here."
          }
          icon={Link2}
          tone={queueMode === "auto" ? "info" : "warning"}
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {MEASURE_KIND_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={kindFilter === filter.value ? "default" : "outline"}
                className="h-8"
                disabled={listLocked}
                onClick={() => setKindFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div
            className={cn(
              "relative space-y-3",
              listLocked && "pointer-events-none opacity-60",
            )}
            aria-busy={listLocked}
            aria-disabled={listLocked}
          >
            {filteredItems.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                No aliases in this measure-kind filter.
              </p>
            ) : (
              filteredItems.map((item) => {
                const measure =
                  item.kind === "indicator"
                    ? detectMeasureKind(item.rawText)
                    : null;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4",
                      queueMode === "auto"
                        ? "border-info/25 bg-info/[0.04]"
                        : item.kind === "indicator"
                          ? "border-warning/25 bg-warning/[0.04]"
                          : "border-info/25 bg-info/[0.04]",
                    )}
                  >
                    {item.kind === "indicator" ? (
                      <Checkbox
                        className="mt-1"
                        checked={selectedIds.includes(item.id)}
                        disabled={
                          (queueMode === "auto" && !item.indicatorId) ||
                          accepting ||
                          rejectingMany
                        }
                        onCheckedChange={(checked) =>
                          toggleSelected(item.id, checked === true)
                        }
                        aria-label={
                          queueMode === "auto"
                            ? `Mark ${item.rawText} to accept`
                            : `Mark ${item.rawText} to exclude`
                        }
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {item.rawText}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-[10px] uppercase",
                            item.kind === "indicator"
                              ? "border-warning/30 bg-warning/10 text-amber-700 dark:text-warning"
                              : "border-info/30 bg-info/10 text-info",
                          )}
                        >
                          {item.kind}
                        </Badge>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {item.method}
                          {item.confidence ? ` · ${item.confidence}` : ""}
                        </Badge>
                        {measure && measure.kind !== "cases" ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-primary/30 bg-primary/5 text-[10px] text-primary"
                          >
                            {measure.label}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.normalized}
                      </p>
                      {item.kind === "indicator" ? (
                        <AliasReviewContextPanel item={item} compact />
                      ) : item.sheetName ? (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.sheetName}
                          {item.cellRef ? ` · ${item.cellRef}` : ""}
                        </p>
                      ) : null}
                      {global && (item.datasetSlug || item.datasetTitle) && (
                        <p className="mt-1 truncate text-xs">
                          {item.datasetSlug ? (
                            <Link
                              href={`/datasets/${item.datasetSlug}/ingestion?tab=aliases`}
                              className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                              {item.datasetTitle ?? item.datasetSlug}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              {item.datasetTitle}
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {item.kind === "indicator" ? (
                      <div className="flex shrink-0 items-center gap-2">
                        {queueMode === "auto" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={listLocked || !item.indicatorId}
                              onClick={() => handleAcceptOne(item.id)}
                            >
                              <CheckCircle2 className="size-4" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={listLocked}
                              onClick={() => setDeciding(item)}
                            >
                              Remap
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" onClick={() => setDeciding(item)}>
                            <CheckCircle2 className="size-4" />
                            Confirm
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setRejectTarget(item)}
                          disabled={rejectMutation.isPending || listLocked}
                        >
                          <XCircle className="size-4" />
                          Not an indicator
                        </Button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" onClick={() => setOrgunitItem(item)}>
                          <CheckCircle2 className="size-4" />
                          Confirm ward
                        </Button>
                        <Link href="/gis-reference">
                          <Button size="sm" variant="outline">
                            <MapPin className="size-4" />
                            GIS coverage
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Panel>
      )}

      <OrgunitConfirmDialog
        item={orgunitItem}
        onOpenChange={(open) => !open && setOrgunitItem(null)}
      />

      <AliasDecisionDialog
        item={deciding}
        onOpenChange={(open) => !open && setDeciding(null)}
        onConfirm={handleConfirm}
        isSaving={confirmMutation.isPending}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title="Not an indicator?"
        description={
          rejectTarget
            ? queueMode === "auto"
              ? `“${rejectTarget.rawText}” is not a programme metric. Matching staged rows will be excluded from analytics and removed from this queue. Use Remap instead if this label should map to a different indicator.`
              : `“${rejectTarget.rawText}” looks like a sheet header or layout label, not a health indicator. Matching staged rows will be excluded from analytics. Use Confirm or Create and map if it is a real metric.`
            : ""
        }
        confirmLabel="Not an indicator"
        variant="destructive"
        loading={rejectMutation.isPending}
        onConfirm={handleNotAnIndicatorConfirm}
      />

      <ConfirmDialog
        open={acceptSelectedOpen}
        onOpenChange={setAcceptSelectedOpen}
        title="Accept selected auto-matches?"
        description={
          selectedCount === 0
            ? ""
            : `This stamps ${selectedCount.toLocaleString()} marked alias${
                selectedCount === 1 ? "" : "es"
              } as accepted, keeping the engine mapping. Pending aliases are not changed.`
        }
        confirmLabel="Accept selected"
        onConfirm={handleAcceptSelectedAuto}
      />

      <ConfirmDialog
        open={rejectSelectedOpen}
        onOpenChange={setRejectSelectedOpen}
        title="Mark selected as not an indicator?"
        description={
          selectedCount === 0
            ? ""
            : `${selectedCount.toLocaleString()} marked label${
                selectedCount === 1 ? "" : "s"
              } will be excluded from analytics and removed from this queue. Use Remap on a row instead if a label should map to a different indicator.`
        }
        confirmLabel="Not an indicator"
        variant="destructive"
        loading={rejectingMany}
        onConfirm={handleRejectSelected}
      />
    </div>
  );
}
