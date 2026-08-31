// Locale-proof date formatting. Plain `.toLocaleDateString()` renders
// differently depending on the browser's OS locale (M/D/Y on en-US,
// D/M/Y on en-GB) — the same timestamp reads as a different date to
// different admins. These always render the same way everywhere.

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/** "22 Jul 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Whole calendar days from `from` to `to` (local dates, ignoring time). */
export function calendarDaysBetween(
  from: string | Date,
  to: string | Date,
): number {
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end) return 0;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24));
}

/** Days elapsed since start (0 if not started yet). */
export function daysActiveSince(start: string | Date, now = new Date()): number {
  return Math.max(0, calendarDaysBetween(start, now));
}

/** Days until start (0 if already started). */
export function daysUntilStart(start: string | Date, now = new Date()): number {
  return Math.max(0, calendarDaysBetween(now, start));
}

/** Days until end (0 if past end). */
export function daysUntilEnd(end: string | Date, now = new Date()): number {
  return Math.max(0, calendarDaysBetween(now, end));
}

/** "22 Jul 2026, 14:35" */
export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${formatDate(date)}, ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
