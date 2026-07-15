import { Globe, Lock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Visibility } from "@/types";

const CONFIG: Record<
  Visibility,
  { label: string; icon: typeof Globe; className: string }
> = {
  public: {
    label: "Public",
    icon: Globe,
    className: "bg-success text-success-foreground",
  },
  restricted: {
    label: "Restricted",
    icon: ShieldAlert,
    className: "bg-warning text-warning-foreground",
  },
  private: {
    label: "Private",
    icon: Lock,
    className: "bg-muted text-muted-foreground",
  },
};

export function VisibilityBadge({
  visibility,
  className,
}: {
  visibility: Visibility;
  className?: string;
}) {
  const { label, icon: Icon, className: tone } = CONFIG[visibility];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}
