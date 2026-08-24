"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Link2, MapPin, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { AliasDecisionDialog } from "@/components/admin/alias-decision-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MetricCard, Panel } from "@/components/admin/admin-analytics-ui";
import {
  useReviewQueue,
  useConfirmIndicatorAlias,
  useRejectIndicatorAlias,
} from "@/lib/hooks/useIngestionReview";
import type { ReviewQueueItem } from "@/lib/api/ingestion-review";
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
  const { data: items, isLoading } = useReviewQueue(datasetId, {
    global,
    limit: limit ?? (global ? 200 : undefined),
  });
  const confirmMutation = useConfirmIndicatorAlias(datasetId);
  const rejectMutation = useRejectIndicatorAlias(datasetId);
  const [deciding, setDeciding] = useState<ReviewQueueItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReviewQueueItem | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Nothing pending review"
        description={
          global
            ? "Every pending indicator and org-unit alias across the platform has been decided."
            : "Every indicator and org-unit string in this dataset resolved automatically, or has already been decided."
        }
      />
    );
  }

  const handleConfirm = (indicatorId: string) => {
    if (!deciding) return;
    confirmMutation.mutate(
      { aliasId: deciding.id, indicatorId },
      {
        onSuccess: (result) => {
          toast.success(`Confirmed — ${result.promoted} staged row(s) resolved`);
          setDeciding(null);
        },
        onError: (error: unknown) =>
          toast.error(error instanceof Error ? error.message : "Failed to confirm"),
      }
    );
  };

  const handleRejectConfirm = () => {
    if (!rejectTarget) return;
    rejectMutation.mutate(rejectTarget.id, {
      onSuccess: () => {
        toast.success("Alias rejected");
        setRejectTarget(null);
      },
      onError: (error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Failed to reject"),
    });
  };

  const indicatorCount = items.filter((i) => i.kind === "indicator").length;
  const orgUnitCount = items.length - indicatorCount;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Pending aliases"
          value={items.length}
          icon={Link2}
          tone="warning"
        />
        <MetricCard
          label="Indicator strings"
          value={indicatorCount}
          icon={CheckCircle2}
          tone="info"
        />
        <MetricCard
          label="Org-unit strings"
          value={orgUnitCount}
          icon={MapPin}
          tone="muted"
        />
      </div>

      <Panel
        title={global ? "Platform alias queue" : "Dataset alias queue"}
        description={
          global
            ? "Confirm maps a string to a registry indicator; reject discards it."
            : "Resolve indicator and org-unit strings for this dataset."
        }
        icon={Link2}
        tone="warning"
      >
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4",
                item.kind === "indicator"
                  ? "border-warning/25 bg-warning/[0.04]"
                  : "border-info/25 bg-info/[0.04]"
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{item.rawText}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px] uppercase",
                      item.kind === "indicator"
                        ? "border-warning/30 bg-warning/10 text-amber-700 dark:text-warning"
                        : "border-info/30 bg-info/10 text-info"
                    )}
                  >
                    {item.kind}
                  </Badge>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {item.method}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.normalized}
                  {item.sheetName && ` · ${item.sheetName}${item.cellRef ? `!${item.cellRef}` : ""}`}
                </p>
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
                      <span className="text-muted-foreground">{item.datasetTitle}</span>
                    )}
                  </p>
                )}
              </div>

              {item.kind === "indicator" ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" onClick={() => setDeciding(item)}>
                    <CheckCircle2 className="size-4" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRejectTarget(item)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                </div>
              ) : (
                <Link href="/gis-reference">
                  <Button size="sm" variant="outline">
                    <MapPin className="size-4" />
                    Resolve in GIS Reference
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </Panel>

      <AliasDecisionDialog
        item={deciding}
        onOpenChange={(open) => !open && setDeciding(null)}
        onConfirm={handleConfirm}
        isSaving={confirmMutation.isPending}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title="Reject this alias?"
        description={
          rejectTarget
            ? `“${rejectTarget.rawText}” will be discarded and will not map to a registry indicator. Staged rows using this string stay unresolved until you confirm a different mapping or re-run ingestion.`
            : ""
        }
        confirmLabel="Reject alias"
        variant="destructive"
        loading={rejectMutation.isPending}
        closeOnConfirm={false}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
