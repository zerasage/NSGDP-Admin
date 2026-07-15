import { SuperAdminGuard } from "@/lib/auth/super-admin-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminGuard>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </SuperAdminGuard>
  );
}
