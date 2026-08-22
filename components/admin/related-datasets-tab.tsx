"use client";

import Link from "next/link";
import { CheckCircle2, Link2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { useRelations, useConfirmRelation, useRejectRelation } from "@/lib/hooks/useIngestionReview";
import type { RelationView } from "@/lib/api/ingestion-review";
import { toast } from "sonner";

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
        description="Cross-dataset matching runs after other datasets publish — a strong overlap in indicators, org units, and periods surfaces here as a candidate."
      />
    );
  }

  return (
    <div className="space-y-3">
      {relations.map((relation) => {
        const other = otherDataset(relation, datasetId);
        return (
          <Card key={relation.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
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
                <Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
