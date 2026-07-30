"use client";

import { useState } from "react";
import { UserPlus, Mail, RotateCw, Users, MailPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  useStaffMembers,
  useStaffInvites,
  useCreateStaffInvite,
  useRevokeStaffInvite,
  useResendStaffInvite,
  useRevokeStaffStatus,
} from "@/lib/hooks/useStaff";
import { useQuery } from "@tanstack/react-query";
import { getPermissionGroups } from "@/lib/api/permissions";
import type { StaffMember, StaffInvite } from "@/lib/api/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { ApiError } from "@/lib/api/client";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  suspended: { label: "Suspended", variant: "destructive" },
  archived: { label: "Archived", variant: "outline" },
};

const INVITE_STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  expired: { label: "Expired", variant: "outline" },
  revoked: { label: "Revoked", variant: "destructive" },
};

export default function StaffPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const { data: staff, isLoading: staffLoading } = useStaffMembers();
  const { data: invites, isLoading: invitesLoading } = useStaffInvites();
  const { data: groups } = useQuery({
    queryKey: ["permission-groups"],
    queryFn: getPermissionGroups,
  });

  const createInvite = useCreateStaffInvite();
  const revokeInvite = useRevokeStaffInvite();
  const resendInvite = useResendStaffInvite();
  const revokeStatus = useRevokeStaffStatus();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [groupId, setGroupId] = useState<string>("");
  const [message, setMessage] = useState("");

  const [revokeStaffTarget, setRevokeStaffTarget] = useState<StaffMember | null>(null);
  const [revokeInviteTarget, setRevokeInviteTarget] = useState<StaffInvite | null>(null);

  const activeGroups = (groups ?? []).filter((g) => g.is_active);
  const pendingInvites = (invites ?? []).filter((i) => i.status === "pending");

  const resetInviteForm = () => {
    setEmail("");
    setGroupId("");
    setMessage("");
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!groupId) {
      toast.error("Please select a permission group for this staff member");
      return;
    }
    createInvite.mutate(
      { invited_email: email, target_group_id: groupId, message: message || undefined },
      {
        onSuccess: () => {
          toast.success(`Invite sent to ${email}`);
          setInviteOpen(false);
          resetInviteForm();
        },
        onError: (error) => {
          const msg = error instanceof ApiError ? error.message : "Failed to send invite";
          toast.error(msg);
        },
      },
    );
  };

  const confirmRevokeStaff = () => {
    if (!revokeStaffTarget) return;
    revokeStatus.mutate(revokeStaffTarget.id, {
      onSuccess: () => {
        toast.success(`Revoked staff access for ${revokeStaffTarget.fullName}`);
        setRevokeStaffTarget(null);
      },
      onError: (error) => {
        const msg = error instanceof ApiError ? error.message : "Failed to revoke staff status";
        toast.error(msg);
      },
    });
  };

  const handleResendInvite = (invite: StaffInvite) => {
    resendInvite.mutate(invite.id, {
      onSuccess: () => toast.success(`Invite resent to ${invite.invitedEmail}`),
      onError: (error) => {
        const msg = error instanceof ApiError ? error.message : "Failed to resend invite";
        toast.error(msg);
      },
    });
  };

  const confirmRevokeInvite = () => {
    if (!revokeInviteTarget) return;
    revokeInvite.mutate(revokeInviteTarget.id, {
      onSuccess: () => {
        toast.success(`Revoked invite for ${revokeInviteTarget.invitedEmail}`);
        setRevokeInviteTarget(null);
      },
      onError: (error) => {
        const msg = error instanceof ApiError ? error.message : "Failed to revoke invite";
        toast.error(msg);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agency Staff</h1>
          <p className="text-muted-foreground mt-1">
            Staff have no organisation — their capability comes entirely from the permission
            group they belong to.
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            Invite Staff
          </Button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="rounded-lg border px-4 py-3 text-sm bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Only super_admin can invite staff, view pending invites, or revoke staff status.
        </div>
      )}

      {isSuperAdmin && (
        <Tabs defaultValue="staff" className="w-full">
          <TabsList className="h-12 p-1 gap-1 bg-muted/70">
            <TabsTrigger
              value="staff"
              className="h-full px-5 text-base font-semibold data-active:shadow-md"
            >
              <Users className="size-4" />
              Staff
              <Badge variant="secondary" className="ml-1.5">{staff?.length ?? 0}</Badge>
            </TabsTrigger>
            <TabsTrigger
              value="invites"
              className="h-full px-5 text-base font-semibold data-active:shadow-md"
            >
              <MailPlus className="size-4" />
              Invites
              {pendingInvites.length > 0 && (
                <Badge className="ml-1.5">{pendingInvites.length} pending</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="mt-4">
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Permission Group</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last Login</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                  ) : !staff || staff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8">
                        <EmptyState
                          title="No staff members yet"
                          description="Invite someone to get started — they'll need a permission group to have any capability."
                        />
                      </td>
                    </tr>
                  ) : (
                    staff.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="px-4 py-3">{s.fullName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                        <td className="px-4 py-3">
                          {s.groupName ? (
                            <Badge variant="outline">{s.groupName}</Badge>
                          ) : (
                            <span className="text-muted-foreground">No group — zero permissions</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_BADGE[s.status]?.variant ?? "outline"}>
                            {STATUS_BADGE[s.status]?.label ?? s.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {s.lastLoginAt ? formatDateTime(s.lastLoginAt) : "Never"}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRevokeStaffTarget(s)}
                          >
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="invites" className="mt-4">
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Target Group</th>
                    <th className="px-4 py-3 font-medium">Invited By</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitesLoading ? (
                    Array.from({ length: 2 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                  ) : !invites || invites.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8">
                        <EmptyState title="No invites sent yet" description="" />
                      </td>
                    </tr>
                  ) : (
                    invites.map((i) => (
                      <tr key={i.id} className="border-b last:border-0">
                        <td className="px-4 py-3">{i.invitedEmail}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{i.targetGroupName}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{i.invitedByName}</td>
                        <td className="px-4 py-3">
                          <Badge variant={INVITE_STATUS_BADGE[i.status]?.variant ?? "outline"}>
                            {INVITE_STATUS_BADGE[i.status]?.label ?? i.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(i.expiresAt)}</td>
                        <td className="px-4 py-3">
                          {i.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvite(i)}
                                disabled={resendInvite.isPending}
                              >
                                <RotateCw className="size-3.5" />
                                Resend
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRevokeInviteTarget(i)}
                              >
                                Revoke
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Invite modal */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { if (!open) resetInviteForm(); setInviteOpen(open); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5" />
              Invite Agency Staff
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="staff-email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="staff@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-group">
                Permission Group <span className="text-destructive">*</span>
              </Label>
              <Select value={groupId} onValueChange={(v) => v && setGroupId(v)}>
                <SelectTrigger id="staff-group" className="w-full">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {activeGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Determines everything this staff member can do — they have no capability outside
                this group's grants.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-message">Personal Message (optional)</Label>
              <Textarea
                id="staff-message"
                placeholder="Welcome to the team!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInvite.isPending}>
                {createInvite.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!revokeStaffTarget}
        onOpenChange={(open) => !open && setRevokeStaffTarget(null)}
        title="Revoke staff status?"
        description={`${revokeStaffTarget?.fullName ?? "This user"} will be demoted to a regular registered account, removed from their permission group, and signed out everywhere immediately.`}
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={confirmRevokeStaff}
        loading={revokeStatus.isPending}
      />

      <ConfirmDialog
        open={!!revokeInviteTarget}
        onOpenChange={(open) => !open && setRevokeInviteTarget(null)}
        title="Revoke invite?"
        description={`The invite link sent to ${revokeInviteTarget?.invitedEmail ?? "this email"} will stop working.`}
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={confirmRevokeInvite}
        loading={revokeInvite.isPending}
      />
    </div>
  );
}
