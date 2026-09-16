import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { HelpTip } from "@/components/admin/help-tip";
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
  tip,
  icon: Icon,
  tone = "primary",
  className,
  compact = false,
  onClick,
  active = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tip?: string;
  icon?: LucideIcon;
  tone?: MetricTone;
  className?: string;
  /** Denser padding/type scale — opt in per usage, default sizing is unchanged. */
  compact?: boolean;
  /** Renders the card as a button that filters/navigates on click. */
  onClick?: () => void;
  /** Highlights the card as the current selection (only meaningful with onClick). */
  active?: boolean;
}) {
  const t = METRIC_TONE[tone];
  // Stays a <div> (not a real <button>) even when clickable, because the
  // optional HelpTip below renders its own <button> — nesting a button
  // inside a button is invalid HTML. role="button" + onKeyDown keeps it
  // keyboard-accessible instead.
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "w-full rounded-2xl border text-left transition-colors",
        compact ? "p-3" : "p-4",
        t.card,
        onClick &&
          "cursor-pointer hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        active && "ring-2 ring-primary/50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "flex items-center gap-1 font-semibold uppercase tracking-wide text-muted-foreground",
            compact ? "text-[10px]" : "text-[11px]"
          )}
        >
          {label}
          {tip ? <HelpTip content={tip} label={`Help: ${label}`} /> : null}
        </p>
        {Icon ? (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg border",
              compact ? "size-7" : "size-9",
              t.well
            )}
          >
            <Icon className={cn(compact ? "size-3.5" : "size-4", t.icon)} aria-hidden />
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          "font-bold tabular-nums tracking-tight",
          compact ? "mt-1.5 text-lg" : "mt-2 text-xl sm:text-2xl",
          t.value
        )}
      >
        {value}
      </div>
      {hint ? (
        <p className={cn("text-muted-foreground", compact ? "mt-0.5 text-[11px]" : "mt-1 text-xs")}>
          {hint}
        </p>
      ) : null}
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
  titleTip,
  description,
  action,
  children,
  className,
  tone = "primary",
  icon: Icon,
}: {
  title: ReactNode;
  titleTip?: string;
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
            {titleTip ? (
              <HelpTip
                content={titleTip}
                label={
                  typeof title === "string" ? `Help: ${title}` : "Section help"
                }
              />
            ) : null}
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
