"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Lock, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useUsers, useUpdateUserStatus, useDeactivateUserDelegated } from "@/lib/hooks/useAdmin";
import { adminApi, type AdminUser } from "@/lib/api/admin";
import { RoleBadge } from "@/components/data/role-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { alertSurface } from "@/lib/constants/status-surfaces";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "archived", label: "Archived" },
];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { hasAnyPermission, isLoading: permissionsLoading } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";
  const canViewUsers =
    isSuperAdmin ||
    hasAnyPermission("invite:users", "promote:org-admin", "demote:org-admin", "remove:org-members");
  // Deactivating a user is super_admin only — not delegatable.
  const canSuspend = isSuperAdmin;

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);

  // Debounce the search box so we're not firing a new request per keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Super admin sees all users
  const isOrgScoped = false; // Admin portal is super_admin only
  const orgId = undefined;

  // Fetch users from real API — role/status/search are all server-side filters
  const { data: usersData, isLoading } = useUsers({
    page: 1,
    limit: 100,
    organisationId: isOrgScoped ? orgId : undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedQuery || undefined,
  }, canViewUsers);

  const updateStatusMutation = useUpdateUserStatus();
  const deactivateMutation = useDeactivateUserDelegated();

  const { data: organisationsData } = useQuery({
    queryKey: ["admin", "organisations"],
    queryFn: async () => {
      const response = await adminApi.get<{ data: { data: { id: string; name: string }[] } }>(
        "/admin/organisations?page=1&limit=100"
      );
      return response.data.data;
    },
  });
  const orgName = (id: string | null) =>
    organisationsData?.data?.find((o) => o.id === id)?.name ?? "—";

  const users = useMemo(() => {
    return usersData?.data || [];
  }, [usersData]);

  // Role/status/search are already applied server-side above.
  const filtered = users;

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("No users to export");
      return;
    }

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Role",
      "Status",
      "Organisation",
      "Last Login",
      "Created",
    ];
    const rows = filtered.map((u) => [
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number ?? "",
      u.role,
      u.status,
      orgName(u.organisation_id),
      u.last_login_at ? formatDate(u.last_login_at) : "Never",
      formatDate(u.created_at),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filtered.length} user${filtered.length !== 1 ? "s" : ""}`);
  };

  const changeStatus = (u: AdminUser, status: AdminUser["status"]) => {
    updateStatusMutation.mutate(
      { userId: u.id, data: { status } },
      {
        onSuccess: () => {
          const verb = status === "active" ? "Approved" : status === "suspended" ? "Suspended" : "Reactivated";
          toast.success(`${verb} ${u.first_name} ${u.last_name}`);
          setSuspendTarget(null);
        },
        onError: () => {
          toast.error("Failed to update status");
        },
      }
    );
  };

  const suspendUser = (u: AdminUser) => {
    deactivateMutation.mutate(
      { userId: u.id },
      {
        onSuccess: () => {
          toast.success(`Suspended ${u.first_name} ${u.last_name}`);
          setSuspendTarget(null);
        },
        onError: () => {
          toast.error("Failed to suspend user");
        },
      }
    );
  };

  if (!permissionsLoading && !canViewUsers) {
    return (
      <EmptyState
        icon={Lock}
        title="Access restricted"
        description="Viewing users requires invite:users, promote:org-admin, demote:org-admin, or remove:org-members. Ask a super_admin to grant your group one of these."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            {isOrgScoped
              ? "Manage users within your organisation only"
              : `${users.length} platform users`}
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {isOrgScoped && (
        <div className={cn("rounded-lg border px-4 py-3 text-sm", alertSurface.amber)}>
          Organisation-scoped view: you can only view and manage users belonging to your organisation.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.key}
            variant={statusFilter === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => v && setRoleFilter(v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="contributor">Contributor</SelectItem>
            <SelectItem value="admin">Org Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Organisation</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={7} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  <p className="text-lg">No users found</p>
                  <p className="text-sm mt-2">No users match your filters</p>
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.first_name} {u.last_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{orgName(u.organisation_id)}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 capitalize">{u.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.last_login_at ? formatDate(u.last_login_at) : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {isSuperAdmin && u.id !== user?.id && u.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => changeStatus(u, "active")}
                          >
                            Approve
                          </Button>
                        )}
                        {canSuspend && u.id !== user?.id && u.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deactivateMutation.isPending}
                            onClick={() => setSuspendTarget(u)}
                          >
                            Suspend
                          </Button>
                        )}
                        {isSuperAdmin && u.id !== user?.id && u.status === "suspended" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => changeStatus(u, "active")}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        title="Suspend user?"
        description={`"${suspendTarget?.first_name} ${suspendTarget?.last_name}" will immediately lose access and be unable to log in until reactivated.`}
        confirmLabel="Suspend"
        variant="destructive"
        loading={deactivateMutation.isPending}
        onConfirm={() => {
          if (!suspendTarget) return;
          suspendUser(suspendTarget);
        }}
      />
    </div>
  );
}
