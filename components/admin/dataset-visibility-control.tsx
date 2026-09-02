"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpTip } from "@/components/admin/help-tip";
import { VisibilityBadge } from "@/components/data/visibility-badge";
import { updateDatasetVisibility } from "@/lib/api/admin";
import { VISIBILITY_OPTION_TIPS } from "@/lib/constants/review-tooltips";
import { UPLOAD_FIELD_TOOLTIPS } from "@/lib/constants/upload-tooltips";
import type { Visibility } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: "Public",
  restricted: "Restricted",
  private: "Private",
};

type DatasetVisibilityControlProps = {
  slug: string;
  visibility: Visibility;
  canEdit: boolean;
  /** Pill style for badge rows (dataset header). */
  compact?: boolean;
  /** Full-width layout for narrow sidebars (review summary). */
  stacked?: boolean;
  /** Show the ? help icon beside the control (default true). */
  showHelpTip?: boolean;
};

export function DatasetVisibilityControl({
  slug,
  visibility,
  canEdit,
  compact = false,
  stacked = false,
  showHelpTip = true,
}: DatasetVisibilityControlProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: Visibility) => updateDatasetVisibility(slug, next),
    onSuccess: (dataset) => {
      toast.success(
        dataset.visibility === "private"
          ? "Visibility set to private — removed from public catalogue if it was published"
          : "Visibility updated",
      );
      queryClient.invalidateQueries({ queryKey: ["dataset", slug] });
      queryClient.invalidateQueries({ queryKey: ["admin", "datasets"] });
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to update visibility",
      ),
  });

  if (!canEdit) {
    return <VisibilityBadge visibility={visibility} />;
  }

  return (
    <div
      className={cn(
        "gap-1.5",
        stacked ? "flex w-full flex-col items-stretch" : "inline-flex items-center",
      )}
    >
      <Select
        value={visibility}
        disabled={mutation.isPending}
        onValueChange={(value) => {
          if (!value || value === visibility) return;
          mutation.mutate(value as Visibility);
        }}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            "border-dashed font-medium",
            compact
              ? "h-7 min-w-[6.75rem] rounded-full px-2.5 text-xs"
              : stacked
                ? "h-9 w-full min-w-0"
                : "h-9 min-w-[7.5rem]",
          )}
          aria-label="Dataset visibility"
        >
          <SelectValue>{VISIBILITY_LABELS[visibility]}</SelectValue>
        </SelectTrigger>
        <SelectContent
          align={stacked ? "start" : "end"}
          alignItemWithTrigger={false}
          className="!w-auto min-w-[15rem] max-w-[min(18rem,calc(100vw-2rem))]"
        >
          {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((value) => (
            <SelectItem
              key={value}
              value={value}
              className="items-start py-2 pr-10 **:whitespace-normal"
            >
              <span className="flex flex-col gap-0.5 text-left">
                <span className="font-medium leading-none">
                  {VISIBILITY_LABELS[value]}
                </span>
                <span className="text-xs leading-snug text-muted-foreground">
                  {VISIBILITY_OPTION_TIPS[value]}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showHelpTip ? (
        <HelpTip
          content={UPLOAD_FIELD_TOOLTIPS.visibility}
          label="About dataset visibility"
          className={stacked ? "self-end" : undefined}
        />
      ) : null}
    </div>
  );
}
