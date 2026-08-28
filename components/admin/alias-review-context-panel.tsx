import { Badge } from "@/components/ui/badge";
import type { ReviewQueueItem } from "@/lib/api/ingestion-review";
import {
  formatSampleObservation,
  formatStagingCellRef,
} from "@/lib/utils/alias-review-context";

interface AliasReviewContextPanelProps {
  item: ReviewQueueItem;
  compact?: boolean;
}

export function AliasReviewContextPanel({
  item,
  compact = false,
}: AliasReviewContextPanelProps) {
  const cell = formatStagingCellRef(item.sheetName, item.sample?.cellRef ?? item.cellRef);
  const sampleLine = formatSampleObservation(item.sample);

  return (
    <div
      className={
        compact
          ? "mt-2 space-y-1.5 rounded-lg border bg-muted/20 px-3 py-2"
          : "space-y-2 rounded-lg border bg-muted/20 px-3 py-3"
      }
    >
      {item.programmeHint ? (
        <p className="text-xs leading-snug text-foreground">{item.programmeHint}</p>
      ) : null}

      {item.suggestedRegistryName ? (
        <p className="text-xs leading-snug">
          <span className="text-muted-foreground">Suggested name: </span>
          <span className="font-medium text-foreground">
            {item.suggestedRegistryName}
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {item.sheetName ? <span>Sheet: {item.sheetName}</span> : null}
        {item.affectedRows != null ? (
          <span>{item.affectedRows.toLocaleString()} staged rows</span>
        ) : null}
        {cell ? <span className="break-all">Cell: {cell}</span> : null}
      </div>

      {sampleLine ? (
        <p className="text-xs text-muted-foreground">
          Example: <span className="text-foreground">{sampleLine}</span>
          <span className="text-muted-foreground"> (LGA · period · value)</span>
        </p>
      ) : null}

      {item.siblingLabels && item.siblingLabels.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Same sheet:</span>
          {item.siblingLabels.map((label) => (
            <Badge
              key={label}
              variant="outline"
              className="max-w-[12rem] truncate text-[10px] font-normal"
              title={label}
            >
              {label}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
