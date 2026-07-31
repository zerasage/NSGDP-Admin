"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
﻿import { SuperAdminGuard } from "@/lib/auth/super-admin-guard";
import { AdminMobileSidebar, AdminSidebar } from "@/components/layout/admin-sidebar";
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
          <main className="flex-1 bg-muted/30 p-4 min-w-0 sm:p-6">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mb-4 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open admin menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="size-4" />
            </Button>
            {children}
          </main>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
