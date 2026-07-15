import { AlertTriangle, CheckCircle2, Clock, HelpCircle } from "lucide-react";
import type { FreshnessStatus } from "@/types";
import { getFreshnessStatus } from "@/lib/utils/freshness";
import { cn } from "@/lib/utils";

export { getFreshnessStatus };

const STATUS_CONFIG: Record<FreshnessStatus, {
  label: string;
  icon: typeof CheckCircle2;
  className: string;
}> = {
  fresh:    { label: "Up to date",  icon: CheckCircle2,  className: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50" },
  due_soon: { label: "Due soon",    icon: Clock,         className: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50" },
  overdue:  { label: "Overdue",     icon: AlertTriangle, className: "text-destructive bg-destructive/10 dark:bg-destructive/20" },
  unknown:  { label: "Unknown",     icon: HelpCircle,    className: "text-muted-foreground bg-muted" },
};

interface FreshnessIndicatorProps {
  lastUpdated: string;
  updateFrequency?: string;
  className?: string;
}

export function FreshnessIndicator({ lastUpdated, updateFrequency, className }: FreshnessIndicatorProps) {
  const status = getFreshnessStatus(lastUpdated, updateFrequency);
  const { label, icon: Icon, className: sc } = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        sc,
        className
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
