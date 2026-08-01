"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { QADimension } from "@/lib/constants/qa-checklist";
import { statusSurface } from "@/lib/constants/status-surfaces";
import { cn } from "@/lib/utils";

export type QAResult = "pass" | "fail" | "na" | "pending";

interface QAChecklistItemProps {
  dimension: QADimension;
  result: QAResult;
  notes?: string;
  onResultChange: (result: QAResult) => void;
  onNotesChange: (notes: string) => void;
  disabled?: boolean;
}

const RESULT_CONFIG: Record<QAResult, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pass:    { label: "Pass",    icon: CheckCircle2, className: statusSurface.emerald },
  fail:    { label: "Fail",    icon: XCircle,      className: statusSurface.destructive },
  na:      { label: "N/A",     icon: AlertCircle,  className: "text-muted-foreground bg-muted border-border" },
  pending: { label: "Pending", icon: AlertCircle,  className: statusSurface.amber },
};

export function QAChecklistItem({
  dimension,
  result,
  notes,
  onResultChange,
  onNotesChange,
  disabled,
}: QAChecklistItemProps) {
  const [expanded, setExpanded] = useState(false);
  const { icon: Icon, className } = RESULT_CONFIG[result];

  return (
    <div className={cn("border-0 p-4 transition-colors", className)}>
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-background/70">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">{dimension.label}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{dimension.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {(["pass", "fail", "na"] as QAResult[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => !disabled && onResultChange(r)}
                  disabled={disabled}
                  className={cn(
                    "h-9 rounded-lg border px-2.5 text-xs font-medium transition-colors sm:h-8",
                    result === r
                      ? RESULT_CONFIG[r].className + " border-current font-semibold"
                      : "border-border bg-background hover:bg-muted text-muted-foreground"
                  )}
                  aria-pressed={result === r}
                >
                  {RESULT_CONFIG[r].label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="ml-1 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:size-8"
                aria-label={expanded ? "Collapse guidance" : "Expand guidance"}
              >
                {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
            </div>
          </div>
          {expanded && (
            <ul className="mt-3 space-y-1.5 rounded-lg bg-muted/40 p-3">
              {dimension.guidanceItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {!disabled && (
            <textarea
              className="mt-3 w-full resize-none rounded-lg border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
              placeholder={`Notes for ${dimension.label}…`}
              value={notes ?? ""}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          )}
          {disabled && notes && (
            <p className="mt-2 text-xs text-muted-foreground italic">{notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
