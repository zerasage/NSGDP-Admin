import { SuperAdminGuard } from "@/lib/auth/super-admin-guard";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminGuard>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col lg:pl-64">
          <AdminHeader />
          <main className="flex-1 p-6 lg:p-8 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
