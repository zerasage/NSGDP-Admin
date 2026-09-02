"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { HelpTip } from "@/components/admin/help-tip";
import { SYSTEM_HEALTH_DEAD_LETTER_TIP } from "@/lib/constants/system-health-tooltips";
import {
  useDeadLetterJobs,
  useDiscardDeadLetterJob,
  useRetryDeadLetterJob,
} from "@/lib/hooks/useIngestionOps";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";

export function DeadLetterPanel() {
  const { data: jobs, isLoading } = useDeadLetterJobs();
  const retryMutation = useRetryDeadLetterJob();
  const discardMutation = useDiscardDeadLetterJob();
  const [discardTarget, setDiscardTarget] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        title="No dead-lettered jobs"
        description="Everything is draining normally."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        Jobs that exhausted every retry.
        <HelpTip content={SYSTEM_HEALTH_DEAD_LETTER_TIP} label="About dead-letter jobs" />
      </p>
      {jobs.map((job) => (
        <div
          key={job.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4 sm:p-5"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{job.payload.jobName}</p>
              <Badge variant="outline" className="text-[10px]">
                {job.payload.queue}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {job.payload.attemptsMade} attempt(s)
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {job.payload.failedReason}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDate(job.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                retryMutation.mutate(job.id, {
                  onSuccess: () => toast.success("Job re-enqueued"),
                  onError: (error: unknown) =>
                    toast.error(
                      error instanceof Error ? error.message : "Failed to retry job",
                    ),
                })
              }
              disabled={retryMutation.isPending}
            >
              <RotateCcw className="size-4" />
              Retry
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDiscardTarget(job.id)}
            >
              <Trash2 className="size-4" />
              Discard
            </Button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={!!discardTarget}
        onOpenChange={(open) => !open && setDiscardTarget(null)}
        title="Discard dead-lettered job?"
        description="This job will not be replayed. This cannot be undone."
        confirmLabel="Discard"
        variant="destructive"
        loading={discardMutation.isPending}
        onConfirm={() => {
          if (!discardTarget) return;
          discardMutation.mutate(discardTarget, {
            onSuccess: () => toast.success("Job discarded"),
            onError: (error: unknown) =>
              toast.error(
                error instanceof Error ? error.message : "Failed to discard job",
              ),
          });
        }}
      />
    </div>
  );
}
