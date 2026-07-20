import type { LifecycleStage } from "@/types";
import type { DatasetStatus } from "@/lib/api/datasets";

/**
 * Maps the real 6-value DatasetStatus onto the prototype's LifecycleStage for
 * display in ApprovalPipeline/LifecycleBadge. The real backend has no separate
 * PUBLISHED status — "approved" is the terminal, publicly-visible state — so
 * approved maps straight to "published" here.
 */
export function toLifecycleStage(status: DatasetStatus): LifecycleStage {
  const map: Record<DatasetStatus, LifecycleStage> = {
    draft: "draft",
    pending: "submitted",
    under_review: "under_review",
    approved: "published",
    rejected: "under_review",
    archived: "archived",
  };
  return map[status];
}
