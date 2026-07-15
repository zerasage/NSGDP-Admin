"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useUsers, useUpdateUserRole } from "@/lib/hooks/useAdmin";
import type { AdminUser } from "@/lib/api/admin";
import { RoleBadge } from "@/components/data/role-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { alertSurface } from "@/lib/constants/status-surfaces";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { user } = useAuth();

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleModal, setRoleModal] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<AdminUser['role']>("contributor");

  const isOrgScoped = user?.role === "admin";
  const orgId = user?.organisationId;

  // Fetch users from real API
  const { data: usersData, isLoading } = useUsers({
    page: 1,
    limit: 100,
    organisationId: isOrgScoped ? orgId : undefined,
  });

  const updateRoleMutation = useUpdateUserRole();

  const users = useMemo(() => {
    return usersData?.data || [];
  }, [usersData]);

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  const exportCsv = () => {
    toast.info("CSV export functionality coming soon");
  };

  const changeRole = () => {
    if (!roleModal) return;
    if (isOrgScoped && roleModal.organisation_id !== orgId) {
      toast.error("You can only manage users within your organisation");
      return;
    }
    
    updateRoleMutation.mutate(
      { userId: roleModal.id, data: { role: newRole } },
      {
        onSuccess: () => {
          toast.success(`Role updated for ${roleModal.firstName} ${roleModal.lastName}`);
          setRoleModal(null);
        },
        onError: () => {
          toast.error("Failed to update role");
        },
      }
    );
  };

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

      <div className="flex flex-wrap gap-3">
        <Select value={roleFilter} onValueChange={(v) => v && setRoleFilter(v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="contributor">Contributor</SelectItem>
            <SelectItem value="contributor">Custodian</SelectItem>
            <SelectItem value="contributor">Validator</SelectItem>
            <SelectItem value="admin">Org Admin</SelectItem>
            <SelectItem value="admin">Repo Admin</SelectItem>
            <SelectItem value="admin">ICT Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
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
            {isLoading
              ? [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              : filtered.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.organisation_id || "—"}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 capitalize">{u.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isOrgScoped && u.organisation_id !== orgId}
                        onClick={() => { setRoleModal(u); setNewRole(u.role); }}
                      >
                        Change Role
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!roleModal} onOpenChange={(o) => !o && setRoleModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role — {roleModal?.firstName} {roleModal?.lastName}</DialogTitle>
          </DialogHeader>
          <Select value={newRole} onValueChange={(v) => v && setNewRole(v as AdminUser['role'])}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(isOrgScoped
                ? (["viewer", "contributor", "data_manager"] as AdminUser['role'][])
                : (["viewer", "contributor", "data_manager", "admin", "super_admin"] as AdminUser['role'][])
              ).map((r) => (
                <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModal(null)}>Cancel</Button>
            <Button onClick={changeRole} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
