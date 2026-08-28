import type {
  ReviewQueueItem,
  ReviewQueueSampleObservation,
} from "@/lib/api/ingestion-review";

export function formatStagingCellRef(
  sheetName: string | undefined,
  cellRef: string | undefined,
): string | null {
  if (!cellRef?.trim()) return sheetName ?? null;
  if (cellRef.includes("!")) return cellRef;
  if (sheetName) return `${sheetName}!${cellRef}`;
  return cellRef;
}

export function formatSampleObservation(
  sample: ReviewQueueSampleObservation | null | undefined,
): string | null {
  if (!sample) return null;
  const parts: string[] = [];
  if (sample.rawOrgunit) parts.push(sample.rawOrgunit);
  if (sample.rawPeriod) parts.push(sample.rawPeriod);
  if (sample.value != null) parts.push(String(sample.value));
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

export function hasAliasReviewContext(item: ReviewQueueItem): boolean {
  return Boolean(
    item.programmeHint ||
      item.affectedRows ||
      (item.siblingLabels && item.siblingLabels.length > 0) ||
      item.sample,
  );
}
