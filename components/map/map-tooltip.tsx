"use client";

import { cn } from "@/lib/utils";

interface MapTooltipProps {
  title: string;
  rows: Array<{ label: string; value: string | number }>;
  x?: number;
  y?: number;
  className?: string;
}

/** Floating tooltip that follows map hover events.
 *  Position via absolute CSS or pass x/y from a Leaflet event.
 */
export function MapTooltip({ title, rows, className }: MapTooltipProps) {
  return (
    <div
      className={cn(
        "pointer-events-none rounded-lg border bg-background/95 backdrop-blur p-3 shadow-lg text-sm min-w-40",
        className
      )}
      role="tooltip"
    >
      <p className="font-semibold mb-2 border-b pb-1.5">{title}</p>
      <dl className="space-y-1">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-xs font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Inline indicator bar (0-100%) for use inside map tooltips */
export function TooltipBar({ value, max, color = "#dc2626" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden" aria-hidden>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
