"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck,
  Users,
  Building2,
  FolderOpen,
  KeyRound,
  BarChart3,
  ScrollText,
  ShieldCheck,
  UsersRound,
  ActivitySquare,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPortalLinks, AdminSidebarBrand } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const adminNavItems: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { href: "/admin", label: "Platform Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/datasets", label: "All Datasets", icon: FileCheck },
  { href: "/admin/organisations", label: "Organisations", icon: Building2 },
  { href: "/admin/users", label: "All Users", icon: Users },
  { href: "/admin/analytics", label: "Platform Analytics", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "Audit Log", icon: ScrollText },
];

function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {adminNavItems.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
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
            {label}
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
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <nav className="flex h-full flex-col gap-1 p-4 overflow-y-auto" aria-label="Admin navigation">
      <AdminSidebarBrand />
      <div className="flex-1 space-y-1 overflow-y-auto">
        <AdminNavLinks onNavigate={onNavigate} />
      </div>
      <div className="border-t pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4 shrink-0" />
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
