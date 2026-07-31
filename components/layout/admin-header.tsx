"use client";

import Link from "next/link";
import { ArrowLeft, Bell, ExternalLink, User } from "lucide-react";
import { GeoHealthLogo } from "@/components/layout/geohealth-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/hooks/useNotifications";

/** Sidebar brand block — links back to the public portal */
export function AdminSidebarBrand() {
  const { user } = useAuth();

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    staff: "Agency Staff",
    admin: "Org Admin",
    contributor: "Contributor",
    registered: "Registered User",
    public: "Guest",
  };

  const roleLabel = user?.role ? roleLabels[user.role] : "Admin";
  // Staff's identity IS their group — no group means zero capability, so
  // surface that plainly rather than just repeating "Agency Staff".
  const subtitle =
    user?.role === "staff"
      ? user.groupName ?? "No permission group — no capability"
      : roleLabel;

  return (
    <div className="mb-3 space-y-3 border-b border-border pb-5 px-1">
      <div className="flex justify-center">
        <GeoHealthLogo compact />
      </div>
      {user && (
        <div className="flex items-center gap-2.5 rounded-lg border bg-muted/50 px-3 py-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="mt-1 truncate text-xs leading-none">
              <span className="text-muted-foreground">Role: </span>
              <span className="font-medium text-foreground">{subtitle}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Footer link strip for leaving admin */
export function AdminPortalLinks({ onNavigate }: { onNavigate?: () => void }) {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL;
  const { data } = useNotifications(1, 1, true);
  const unreadCount = data?.meta.total ?? 0;
  const links = [
    { href: `${portalUrl}/`, label: "Portal Home", icon: ArrowLeft },
    { href: `${portalUrl}/dataportal`, label: "Browse Datasets", icon: ExternalLink },
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
        <div className="flex items-center gap-1">
          <Link
            href="/notifications"
            onClick={onNavigate}
            className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Notifications (${unreadCount} unread)`}
            title="Notifications"
          >
            <Bell className="size-4" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-4 text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
