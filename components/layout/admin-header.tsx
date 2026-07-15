"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ExternalLink, Menu, User } from "lucide-react";
import { GeoHealthLogo } from "@/components/layout/geohealth-logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/datasets", label: "Review Queue" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/user-groups", label: "User Groups" },
  { href: "/admin/permissions", label: "Permissions" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/access-requests", label: "Access Requests" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/governance", label: "Governance" },
  { href: "/admin/audit-logs", label: "Audit Log" },
];

function getSectionLabel(pathname: string): string {
  if (pathname.includes("/admin/datasets/") && pathname.includes("/review")) {
    return "Dataset Review";
  }
  if (pathname.includes("/admin/datasets/") && pathname.includes("/approve")) {
    return "Dataset Approval";
  }
  if (pathname.startsWith("/admin/governance/health")) return "Governance · Health Metrics";
  if (pathname.startsWith("/admin/governance/sops")) return "Governance · SOPs";
  if (pathname.startsWith("/admin/governance")) return "Governance";

  const match = SECTION_LABELS.find(({ href, exact }) =>
    exact ? pathname === href : pathname.startsWith(href)
  );
  return match?.label ?? "Admin";
}

interface AdminHeaderProps {
  onMenuClick?: () => void;
  menuOpen?: boolean;
  className?: string;
}

export function AdminHeader({ onMenuClick, menuOpen, className }: AdminHeaderProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const sectionLabel = getSectionLabel(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6",
        className
      )}
    >
      {onMenuClick && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="lg:hidden shrink-0"
          onClick={onMenuClick}
          aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
          aria-expanded={menuOpen}
        >
          <Menu className="size-4" />
        </Button>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin Console
        </p>
        <p className="truncate text-sm font-medium text-foreground">{sectionLabel}</p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {isAuthenticated && (
          <div className="hidden sm:block">
            <NotificationBell />
          </div>
        )}
        <ThemeToggle />
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to Portal</span>
        </Link>
      </div>
    </header>
  );
}

/** Sidebar brand block — links back to the public portal */
export function AdminSidebarBrand() {
  const { user } = useAuth();

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Organization Admin",
    contributor: "Contributor",
    registered: "Registered User",
    public: "Guest",
  };

  const roleLabel = user?.role ? roleLabels[user.role] : "Admin";

  return (
    <div className="mb-6 space-y-3 border-b border-border pb-5 px-1">
      <div className="flex justify-center">
        <GeoHealthLogo compact />
      </div>
      {user && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Footer link strip for leaving admin */
export function AdminPortalLinks({ onNavigate }: { onNavigate?: () => void }) {
  const links = [
    { href: "/", label: "Portal Home", icon: ArrowLeft },
    { href: "/dataportal", label: "Browse Datasets", icon: ExternalLink },
    { href: "/dashboard", label: "My Dashboard", icon: ExternalLink },
  ];

  return (
    <div className="mt-auto space-y-1 border-t border-border pt-4">
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Leave Admin
      </p>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          {label}
        </Link>
      ))}
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <span className="text-xs text-muted-foreground">Theme</span>
        <ThemeToggle />
      </div>
    </div>
  );
}
