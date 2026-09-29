"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { SuperAdminGuard } from "@/lib/auth/super-admin-guard";
import { AdminMobileSidebar, AdminSidebar } from "@/components/layout/admin-sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <SuperAdminGuard>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <AdminMobileSidebar
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
          <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open admin menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="size-4" />
            </Button>
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </div>
          <main className="flex-1 bg-muted/30 p-4 min-w-0 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
