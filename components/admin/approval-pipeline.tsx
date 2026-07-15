import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import type { LifecycleStage } from "@/types";
import { LIFECYCLE_PIPELINE, LIFECYCLE_PIPELINE_STAGES, normalizeLifecycleStage } from "@/lib/constants/dataset-lifecycle";
import { cn } from "@/lib/utils";

export const PIPELINE_STAGES = LIFECYCLE_PIPELINE;

interface ApprovalPipelineProps {
  currentStage: LifecycleStage;
  rejectedAt?: LifecycleStage;
  className?: string;
}

export function ApprovalPipeline({ currentStage, rejectedAt, className }: ApprovalPipelineProps) {
  const normalized = normalizeLifecycleStage(currentStage);
  const currentIdx =
    normalized === "archived"
      ? -1
      : LIFECYCLE_PIPELINE_STAGES.indexOf(normalized);

  if (normalized === "archived") {
    return (
      <p className="text-sm text-muted-foreground">
        This dataset has been archived and is no longer in the active pipeline.
      </p>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <ol className="flex min-w-max items-start gap-0" aria-label="Approval pipeline">
        {LIFECYCLE_PIPELINE.map(({ stage, label, role }, idx) => {
          const isDone = currentIdx >= 0 && idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isRejected = stage === rejectedAt;
          const isPending = currentIdx >= 0 && idx > currentIdx;

          return (
            <li key={stage} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 z-10",
                    isDone && "bg-emerald-500 border-emerald-500 text-white",
                    isCurrent && !isRejected && "bg-primary border-primary text-primary-foreground",
                    isRejected && "bg-destructive border-destructive text-white",
                    isPending && "bg-background border-muted-foreground/30 text-muted-foreground"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isDone && <CheckCircle2 className="size-4" aria-label="Complete" />}
                  {isCurrent && !isRejected && <Clock className="size-4" aria-label="In progress" />}
                  {isRejected && <XCircle className="size-4" aria-label="Rejected" />}
                  {isPending && <Circle className="size-4" aria-label="Pending" />}
                </div>
                <div className="mt-2 flex flex-col items-center text-center w-28">
                  <p
                    className={cn(
                      "text-xs font-medium leading-tight",
                      isDone && "text-emerald-700 dark:text-emerald-400",
                      isCurrent && "text-primary font-semibold",
                      isRejected && "text-destructive",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug">{role}</p>
                </div>
              </div>

              {idx < LIFECYCLE_PIPELINE.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 -mt-6",
                    idx < currentIdx ? "bg-emerald-400" : "bg-muted-foreground/20"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
