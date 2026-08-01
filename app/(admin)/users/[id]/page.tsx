"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  useDeactivateUserDelegated,
  useUpdateUserStatus,
  useUser,
} from "@/lib/hooks/useAdmin";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import type { AdminUser } from "@/lib/api/admin";
import { RoleBadge } from "@/components/data/role-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  const { hasAnyPermission, isLoading: permissionsLoading } = usePermissions();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const canViewUsers =
    isSuperAdmin ||
    hasAnyPermission(
      "invite:users",
      "promote:org-admin",
      "demote:org-admin",
      "remove:org-members"
    );
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);
  const { data: user, isLoading, isError, refetch } = useUser(id, canViewUsers);
  const { data: organisationsData } = useOrganisations(1, 200);
  const updateStatusMutation = useUpdateUserStatus();
  const deactivateMutation = useDeactivateUserDelegated();

  const organisation = organisationsData?.data.find(
    (candidate) => candidate.id === user?.organisation_id
  );
  const canManageStatus = isSuperAdmin && user?.id !== currentUser?.id;

  const activateUser = () => {
    if (!user) return;
    updateStatusMutation.mutate(
      { userId: user.id, data: { status: "active" } },
      {
        onSuccess: () =>
          toast.success(
            `${user.status === "pending" ? "Approved" : "Reactivated"} ${user.first_name} ${user.last_name}`
          ),
        onError: () => toast.error("Failed to update user status"),
      }
    );
  };

  const suspendUser = () => {
    if (!user) return;
    deactivateMutation.mutate(
      { userId: user.id },
      {
        onSuccess: () => {
          toast.success(`Suspended ${user.first_name} ${user.last_name}`);
          setSuspendConfirmOpen(false);
        },
        onError: () => toast.error("Failed to suspend user"),
      }
    );
  };

  if (!permissionsLoading && !canViewUsers) {
    return (
      <EmptyState
        icon={KeyRound}
        title="Access restricted"
        description="Viewing user details requires a user-management permission. Ask a super admin to grant your group access."
      />
    );
  }

  if (isLoading || permissionsLoading) {
    return <UserDetailSkeleton />;
  }

  if (isError || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/users"
          className={cn(buttonVariants({ variant: "ghost", size: "default" }), "-ml-2 h-11 sm:h-8")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Users
        </Link>
        <div className="rounded-2xl border bg-card px-4 py-12 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <UserRound className="size-7" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-semibold">User not available</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The account may not exist, or you may not have permission to view it.
          </p>
          <Button variant="outline" className="mt-5 h-11 sm:h-8" onClick={() => refetch()}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/users"
          className={cn(buttonVariants({ variant: "ghost", size: "default" }), "-ml-2 mb-3 h-11 sm:h-8")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Users
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <UserIdentityAvatar user={user} />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-8">
                {user.first_name} {user.last_name}
              </h1>
              <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <UserStatusBadge status={user.status} />
            <RoleBadge role={user.role} />
          </div>
        </div>
      </div>

      {canManageStatus && (user.status === "pending" || user.status === "active" || user.status === "suspended") && (
        <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center sm:p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Account actions</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Status changes take effect immediately and are recorded in the audit log.
            </p>
          </div>
          {user.status === "pending" && (
            <Button className="h-11 sm:h-8" onClick={activateUser} disabled={updateStatusMutation.isPending}>
              Approve user
            </Button>
          )}
          {user.status === "active" && (
            <Button
              variant="outline"
              className="h-11 sm:h-8"
              onClick={() => setSuspendConfirmOpen(true)}
              disabled={deactivateMutation.isPending}
            >
              Suspend user
            </Button>
          )}
          {user.status === "suspended" && (
            <Button
              className="h-11 sm:h-8"
              onClick={activateUser}
              disabled={updateStatusMutation.isPending}
            >
              Reactivate user
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Account information</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow icon={Mail} label="Email address">
                <a href={`mailto:${user.email}`} className="break-all font-medium hover:underline">
                  {user.email}
                </a>
              </InfoRow>
              <InfoRow icon={Phone} label="Phone number">
                {user.phone_number ? (
                  <a href={`tel:${user.phone_number}`} className="font-medium hover:underline">
                    {user.phone_number}
                  </a>
                ) : (
                  "Not provided"
                )}
              </InfoRow>
              <InfoRow icon={MapPin} label="Location">
                {[user.ward, user.lga].filter(Boolean).join(", ") || "Not provided"}
              </InfoRow>
              <InfoRow icon={Building2} label="Organisation">
                {organisation ? (
                  <Link href={`/organisations/${organisation.slug}`} className="font-medium hover:underline">
                    {organisation.name}
                  </Link>
                ) : (
                  "No organisation"
                )}
              </InfoRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Account timeline</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow icon={CalendarDays} label="Joined platform">
                {formatDate(user.created_at)}
              </InfoRow>
              <InfoRow icon={Clock3} label="Last login">
                {user.last_login_at ? formatDate(user.last_login_at) : "Never signed in"}
              </InfoRow>
              <InfoRow icon={RotateCcw} label="Last account update">
                {formatDate(user.updated_at)}
              </InfoRow>
              <InfoRow icon={CheckCircle2} label="Approved">
                {user.approved_at ? formatDate(user.approved_at) : "Not recorded"}
              </InfoRow>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Access summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SummaryItem label="Role"><RoleBadge role={user.role} /></SummaryItem>
              <SummaryItem label="Account status"><UserStatusBadge status={user.status} /></SummaryItem>
              <SummaryItem label="Email verification">
                <VerificationBadge verified={!!user.email_verified} verifiedLabel="Verified" missingLabel="Not verified" />
              </SummaryItem>
              <SummaryItem label="Multi-factor authentication">
                <VerificationBadge verified={!!user.mfa_enabled} verifiedLabel="Enabled" missingLabel="Not enabled" />
              </SummaryItem>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Record information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">User ID</p>
                <p className="mt-1 break-all font-mono">{user.id}</p>
              </div>
              {currentUser?.id === user.id && (
                <p className="border-t pt-3">This is your current administrator account.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={suspendConfirmOpen}
        onOpenChange={setSuspendConfirmOpen}
        title="Suspend user?"
        description={`"${user.first_name} ${user.last_name}" will immediately lose access and be unable to log in until reactivated.`}
        confirmLabel="Suspend"
        variant="destructive"
        loading={deactivateMutation.isPending}
        onConfirm={suspendUser}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </div>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}

function SummaryItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-4 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function UserIdentityAvatar({ user }: { user: AdminUser }) {
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary" aria-hidden="true">
      {initials || <UserRound className="size-5" />}
    </div>
  );
}

function UserStatusBadge({ status }: { status: AdminUser["status"] }) {
  const variant =
    status === "active"
      ? "default"
      : status === "suspended"
        ? "destructive"
        : status === "archived"
          ? "secondary"
          : "outline";

  return <Badge variant={variant} className="capitalize text-[11px]">{status}</Badge>;
}

function VerificationBadge({
  verified,
  verifiedLabel,
  missingLabel,
}: {
  verified: boolean;
  verifiedLabel: string;
  missingLabel: string;
}) {
  return (
    <Badge variant={verified ? "default" : "outline"} className="gap-1 text-[11px]">
      {verified ? <ShieldCheck className="size-3" aria-hidden="true" /> : <KeyRound className="size-3" aria-hidden="true" />}
      {verified ? verifiedLabel : missingLabel}
    </Badge>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
