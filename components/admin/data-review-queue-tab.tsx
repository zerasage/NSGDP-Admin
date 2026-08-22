"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MapPin, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { AliasDecisionDialog } from "@/components/admin/alias-decision-dialog";
import {
  useReviewQueue,
  useConfirmIndicatorAlias,
  useRejectIndicatorAlias,
} from "@/lib/hooks/useIngestionReview";
import type { ReviewQueueItem } from "@/lib/api/ingestion-review";
import { toast } from "sonner";

export function DataReviewQueueTab({ datasetId }: { datasetId: string }) {
  const { data: items, isLoading } = useReviewQueue(datasetId);
  const confirmMutation = useConfirmIndicatorAlias(datasetId);
  const rejectMutation = useRejectIndicatorAlias(datasetId);
  const [deciding, setDeciding] = useState<ReviewQueueItem | null>(null);

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
        description="Every indicator and org-unit string in this dataset resolved automatically, or has already been decided."
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

  const handleReject = (item: ReviewQueueItem) => {
    rejectMutation.mutate(item.id, {
      onSuccess: () => toast.success("Alias rejected"),
      onError: (error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Failed to reject"),
    });
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{item.rawText}</p>
                <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
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
                  onClick={() => handleReject(item)}
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
          </CardContent>
        </Card>
      ))}

      <AliasDecisionDialog
        item={deciding}
        onOpenChange={(open) => !open && setDeciding(null)}
        onConfirm={handleConfirm}
        isSaving={confirmMutation.isPending}
      />
    </div>
  );
}
