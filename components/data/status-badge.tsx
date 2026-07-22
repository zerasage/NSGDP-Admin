import { cn } from "@/lib/utils";
import type { DatasetStatus } from "@/lib/api/datasets";

const CONFIG: Record<DatasetStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending: { label: "Pending", className: "bg-info text-info-foreground" },
  under_review: {
    label: "Under Review",
    className: "bg-info text-info-foreground",
  },
  // Approval and publishing are separate — an approved dataset isn't
  // necessarily visible to the public yet. See `publishedAt` below.
  approved: {
    label: "Approved",
    className: "bg-warning text-warning-foreground",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive text-white",
  },
  archived: {
    label: "Archived",
    className: "bg-muted text-muted-foreground line-through",
  },
};

export function StatusBadge({
  status,
  publishedAt,
  className,
}: {
  status: DatasetStatus;
  publishedAt?: string | null;
  className?: string;
}) {
  const isPublished = status === "approved" && !!publishedAt;
  const { label, className: tone } = isPublished
    ? { label: "Published", className: "bg-success text-success-foreground" }
    : CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
