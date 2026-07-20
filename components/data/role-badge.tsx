import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const CONFIG: Record<UserRole, { label: string; className: string }> = {
  public:      { label: "Public",           className: "bg-muted text-muted-foreground" },
  registered:  { label: "Registered",       className: "bg-secondary text-secondary-foreground" },
  contributor: { label: "Contributor",      className: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  admin:       { label: "Administrator",    className: "bg-info-100 text-info-800 dark:bg-info-950 dark:text-info-300" },
  super_admin: { label: "Super Admin",      className: "bg-primary text-primary-foreground" },
};

export function RoleBadge({
  role,
  className,
}: {
  role: UserRole;
  className?: string;
}) {
  const config = CONFIG[role] ?? CONFIG.registered;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
