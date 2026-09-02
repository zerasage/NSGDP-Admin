import { TabsList } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Base pill style for admin section tab bars — pair with `tabToneClass()` for active color. */
export const ADMIN_TAB_TRIGGER_BASE =
  "min-h-9 flex-none gap-1.5 px-2.5 text-xs sm:text-sm text-muted-foreground hover:bg-background/80 hover:text-foreground data-active:shadow-none";

type AdminSectionTabsNavProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdminSectionTabsNav({ children, className }: AdminSectionTabsNavProps) {
  return (
    <div
      className={cn(
        "scrollbar-hide overflow-x-auto rounded-xl border bg-muted/30 p-1",
        className
      )}
    >
      <TabsList className="h-auto w-max min-w-full flex-nowrap justify-start gap-1 bg-transparent p-0">
        {children}
      </TabsList>
    </div>
  );
}

export function AdminTabCount({ count, active }: { count: number; active?: boolean }) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
        active
          ? "bg-primary-foreground/20 text-primary-foreground"
          : "bg-background/90 text-foreground"
      )}
    >
      {count}
    </span>
  );
}
