import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MetricTone =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "destructive"
  | "muted";

export const METRIC_TONE: Record<
  MetricTone,
  { card: string; well: string; icon: string; value: string; tabActive: string }
> = {
  primary: {
    card: "border-primary/20 bg-primary/[0.04]",
    well: "border-primary/20 bg-primary/10",
    icon: "text-primary",
    value: "text-foreground",
    tabActive:
      "data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground",
  },
  success: {
    card: "border-success/25 bg-success/[0.06]",
    well: "border-success/25 bg-success/15",
    icon: "text-success",
    value: "text-foreground",
    tabActive:
      "data-active:bg-success data-active:text-success-foreground dark:data-active:bg-success dark:data-active:text-success-foreground",
  },
  info: {
    card: "border-info/25 bg-info/[0.06]",
    well: "border-info/25 bg-info/15",
    icon: "text-info",
    value: "text-foreground",
    tabActive:
      "data-active:bg-info data-active:text-info-foreground dark:data-active:bg-info dark:data-active:text-info-foreground",
  },
  warning: {
    card: "border-warning/30 bg-warning/[0.08]",
    well: "border-warning/30 bg-warning/20",
    icon: "text-amber-700 dark:text-warning",
    value: "text-foreground",
    tabActive:
      "data-active:bg-warning data-active:text-warning-foreground dark:data-active:bg-warning dark:data-active:text-warning-foreground",
  },
  destructive: {
    card: "border-destructive/20 bg-destructive/[0.05]",
    well: "border-destructive/20 bg-destructive/10",
    icon: "text-destructive",
    value: "text-foreground",
    tabActive:
      "data-active:bg-destructive data-active:text-white dark:data-active:bg-destructive dark:data-active:text-white",
  },
  muted: {
    card: "border-dashed bg-muted/20",
    well: "border-border bg-muted/50",
    icon: "text-muted-foreground",
    value: "text-foreground",
    tabActive:
      "data-active:bg-muted data-active:text-foreground dark:data-active:bg-muted dark:data-active:text-foreground",
  },
};

export function tabToneClass(tone: MetricTone = "primary") {
  return METRIC_TONE[tone].tabActive;
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: MetricTone;
  className?: string;
}) {
  const t = METRIC_TONE[tone];
  return (
    <div className={cn("rounded-2xl border p-4", t.card, className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg border",
              t.well
            )}
          >
            <Icon className={cn("size-4", t.icon)} aria-hidden />
          </div>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 text-xl font-bold tabular-nums tracking-tight sm:text-2xl",
          t.value
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function PanelIcon({
  icon: Icon,
  tone = "primary",
}: {
  icon: LucideIcon;
  tone?: MetricTone;
}) {
  const t = METRIC_TONE[tone];
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg border",
        t.well
      )}
    >
      <Icon className={cn("size-4", t.icon)} aria-hidden />
    </span>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  tone = "primary",
  icon: Icon,
}: {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: MetricTone;
  icon?: LucideIcon;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border bg-card", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div className="min-w-0 space-y-1">
          <h2 className="flex items-center gap-2 text-base font-semibold leading-6">
            {Icon ? <PanelIcon icon={Icon} tone={tone} /> : null}
            {title}
          </h2>
          {description ? (
            <p className="text-[13px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function PageEyebrow({
  label,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  icon: LucideIcon;
  tone?: MetricTone;
}) {
  const t = METRIC_TONE[tone];
  return (
    <div
      className={cn(
        "mb-1 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1",
        t.well
      )}
    >
      <Icon className={cn("size-3.5", t.icon)} aria-hidden />
      <span className={cn("text-[11px] font-semibold uppercase tracking-wide", t.icon)}>
        {label}
      </span>
    </div>
  );
}

export function DataTableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border">{children}</div>
  );
}
