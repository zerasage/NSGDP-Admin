"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck,
  Users,
  Building2,
  KeyRound,
  ScrollText,
  ShieldCheck,
  LogOut,
  UserCog,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPortalLinks, AdminSidebarBrand } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { PermissionActionKey } from "@/lib/api/permissions";
import { toast } from "sonner";

export const adminNavItems: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  superAdminOnly?: boolean;
  // Visible if super_admin OR the user holds ANY of these delegated permissions.
  // Omit entirely for items every admin-portal principal can see (dashboard,
  // notifications, and blanket-staff-readable pages like organisations/audit-logs).
  // Note: org admins (role: "admin") never reach this app at all — only
  // super_admin/staff accounts can log into the admin portal — so there's
  // no org-admin bypass to account for here.
  anyPermission?: PermissionActionKey[];
}> = [
  { href: "/", label: "Platform Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/datasets", label: "Review Queue", icon: FileCheck, anyPermission: ["approve:datasets", "publish:datasets"] },
  { href: "/upload?agency=1", label: "Upload to Agency", icon: Upload, anyPermission: ["create:datasets"] },
  { href: "/organisations", label: "Organisations", icon: Building2 },
  { href: "/users", label: "All Users", icon: Users, anyPermission: ["invite:users", "promote:org-admin", "demote:org-admin", "remove:org-members"] },
  { href: "/agency", label: "Agency", icon: UserCog, superAdminOnly: true },
  { href: "/permission-groups", label: "Permission Groups", icon: ShieldCheck, superAdminOnly: true },
  { href: "/access-requests", label: "Access Requests", icon: KeyRound, anyPermission: ["view:access-requests", "approve:access-requests"] },
  // TODO: Enable when analytics backend is ready (post-MS2)
  // { href: "/analytics", label: "Platform Analytics", icon: BarChart3 },
  { href: "/audit-logs", label: "Audit Log", icon: ScrollText },
];

function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <>
      {adminNavItems
        .filter((item) => {
          if (item.superAdminOnly) return isSuperAdmin;
          if (item.anyPermission) return isSuperAdmin || hasAnyPermission(...item.anyPermission);
          return true;
        })
        .map(({ href, label, icon: Icon, exact }) => {
        const hrefPath = href.split("?")[0];
        const active = exact ? pathname === hrefPath : pathname.startsWith(hrefPath);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </Link>
        );
      })}
    </>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      if (onNavigate) onNavigate();
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <nav className="flex h-full flex-col gap-1 overflow-hidden p-4" aria-label="Admin navigation">
      <AdminSidebarBrand />
      <div className="scrollbar-slim min-h-0 flex-1 space-y-1 overflow-y-scroll overscroll-contain pr-1">
        <AdminNavLinks onNavigate={onNavigate} />
      </div>
      <AdminPortalLinks onNavigate={onNavigate} />
      <div className="pt-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-5 shrink-0" data-icon="inline-start" aria-hidden="true" />
          Logout
        </Button>
      </div>
    </nav>
  );
}

/** Desktop sidebar — fixed left */
export function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 border-r bg-card lg:block overflow-hidden">
      <SidebarNav />
    </aside>
  );
}

/** Mobile drawer sidebar */
export function AdminMobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed left-0 top-0 z-50 h-full w-64 border-r bg-card lg:hidden overflow-hidden">
        <SidebarNav onNavigate={onClose} />
      </aside>
    </>
  );
}
