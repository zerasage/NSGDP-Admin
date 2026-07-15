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
    <div className={cn("rounded-lg border p-4 transition-colors", className)}>
      <div className="flex items-start gap-3">
        <Icon className="size-5 shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm">{dimension.label}</p>
            <div className="flex items-center gap-1 shrink-0">
              {(["pass", "fail", "na"] as QAResult[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => !disabled && onResultChange(r)}
                  disabled={disabled}
                  className={cn(
                    "rounded px-2 py-0.5 text-xs font-medium border transition-colors",
                    result === r
                      ? RESULT_CONFIG[r].className + " border-current font-bold"
                      : "border-border bg-background hover:bg-muted text-muted-foreground"
                  )}
                >
                  {RESULT_CONFIG[r].label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="ml-1 text-muted-foreground hover:text-foreground"
                aria-label={expanded ? "Collapse guidance" : "Expand guidance"}
              >
                {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{dimension.description}</p>

          {expanded && (
            <ul className="mt-3 space-y-1">
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
              className="mt-2 w-full rounded-md border bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
