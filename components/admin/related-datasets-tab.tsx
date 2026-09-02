"use client";

import Link from "next/link";
import { CheckCircle2, GitBranch, Link2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { MetricCard, Panel } from "@/components/admin/admin-analytics-ui";
import { RELATED_DATASETS_TIPS } from "@/lib/constants/dataset-tooltips";
import { useRelations, useConfirmRelation, useRejectRelation } from "@/lib/hooks/useIngestionReview";
import type { RelationView } from "@/lib/api/ingestion-review";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function otherDataset(relation: RelationView, datasetId: string) {
  return relation.datasetAId === datasetId
    ? { title: relation.datasetBTitle, slug: relation.datasetBSlug }
    : { title: relation.datasetATitle, slug: relation.datasetASlug };
}

export function RelatedDatasetsTab({ datasetId }: { datasetId: string }) {
  const { data: relations, isLoading } = useRelations(datasetId);
  const confirmMutation = useConfirmRelation(datasetId);
  const rejectMutation = useRejectRelation(datasetId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!relations || relations.length === 0) {
    return (
      <EmptyState
        icon={Link2}
        title="No related datasets found"
        description="Matching runs automatically when ingestion finishes (resolved staging rows) and again when analytics loads into the warehouse. It compares this dataset against other catalogue datasets with shared indicators, org units, and periods (≥40% overlap). Re-uploading on the same dataset record does not self-match — you need a separate dataset with overlapping data."
      />
    );
  }

  const pendingCount = relations.filter((r) => r.status === "pending").length;
  const confirmedCount = relations.filter((r) => r.status === "confirmed").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Candidates" value={relations.length} tip={RELATED_DATASETS_TIPS.candidates} icon={GitBranch} tone="info" />
        <MetricCard label="Pending review" value={pendingCount} tip={RELATED_DATASETS_TIPS.pending} icon={Link2} tone="warning" />
        <MetricCard label="Confirmed" value={confirmedCount} tip={RELATED_DATASETS_TIPS.confirmed} icon={CheckCircle2} tone="success" />
      </div>

      <Panel
        title="Related dataset candidates"
        titleTip={RELATED_DATASETS_TIPS.panel}
        description="Confirm when two uploads describe the same underlying study."
        icon={GitBranch}
        tone="info"
      >
        <div className="space-y-3">
          {relations.map((relation) => {
            const other = otherDataset(relation, datasetId);
            return (
              <div
                key={relation.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4",
                  relation.status === "confirmed"
                    ? "border-success/25 bg-success/[0.04]"
                    : relation.status === "pending"
                      ? "border-warning/25 bg-warning/[0.04]"
                      : "border-border bg-muted/20"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {other.slug ? (
                      <Link href={`/datasets/${other.slug}`} className="hover:underline">
                        {other.title}
                      </Link>
                    ) : (
                      other.title
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {relation.sharedKeys} shared key(s) · {Math.round(Number(relation.overlapRatio) * 100)}% overlap
                  </p>
                </div>

                {relation.status === "confirmed" ? (
                  <Badge className="gap-1 border-success/30 bg-success/10 text-success">
                    <CheckCircle2 className="size-3" />
                    Confirmed
                  </Badge>
                ) : relation.status === "pending" ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        confirmMutation.mutate(relation.id, {
                          onSuccess: () => toast.success("Relation confirmed"),
                          onError: (error: unknown) =>
                            toast.error(error instanceof Error ? error.message : "Failed to confirm"),
                        })
                      }
                      disabled={confirmMutation.isPending}
                    >
                      <CheckCircle2 className="size-4" />
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        rejectMutation.mutate(relation.id, {
                          onSuccess: () => toast.success("Relation rejected"),
                          onError: (error: unknown) =>
                            toast.error(error instanceof Error ? error.message : "Failed to reject"),
                        })
                      }
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="size-4" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground capitalize">
                    {relation.status}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
