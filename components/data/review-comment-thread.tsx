"use client";

import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviewHistory } from "@/lib/hooks/useDatasetReview";
import { formatDateTime } from "@/lib/utils/date";

const ACTION_LABELS: Record<string, string> = {
  submitted: "Submitted for review",
  assigned: "Assigned",
  under_review: "Marked under review",
  revision_requested: "Requested revision",
  validated: "Validated",
  approved: "Approved",
  rejected: "Rejected",
  sent_back: "Sent back to under review",
  comment_added: "Comment",
};

export function ReviewCommentThread({ slug }: { slug: string }) {
  const { data: history, isLoading } = useReviewHistory(slug);

  if (isLoading) {
    return <Skeleton className="h-32 rounded-2xl" />;
  }

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="size-4" />
          Review History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {history.map((entry, i) => (
            <li key={i} className="text-sm border-l-2 border-muted pl-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  {ACTION_LABELS[entry.actionType] ?? entry.actionType}
                </span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{entry.actorName}</p>
              {entry.comment && (
                <p className="mt-1 text-muted-foreground">{entry.comment}</p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
