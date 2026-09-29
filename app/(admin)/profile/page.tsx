"use client";

import { Lock, Shield, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Panel } from "@/components/admin/admin-analytics-ui";
import { Badge } from "@/components/ui/badge";
import { MfaSettingsPanel } from "@/components/admin/mfa-settings-panel";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile &amp; Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account details and sign-in security settings.
        </p>
      </div>

      <Panel title="Account" icon={UserIcon} tone="primary">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Name</dt>
            <dd className="mt-0.5 text-sm">{user.firstName} {user.lastName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Email</dt>
            <dd className="mt-0.5 text-sm">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Role</dt>
            <dd className="mt-0.5 text-sm">
              <Badge variant="outline" className="capitalize">
                {user.role.replace("_", " ")}
              </Badge>
            </dd>
          </div>
          {user.groupName ? (
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Permission group</dt>
              <dd className="mt-0.5 text-sm">{user.groupName}</dd>
            </div>
          ) : null}
        </dl>
      </Panel>

      <Panel
        title="Two-factor authentication"
        description="Off by default — turn it on whenever you want the extra protection."
        icon={Shield}
        tone="muted"
      >
        <MfaSettingsPanel
          initialEnabled={user.mfaEnabled}
          initialMethod={user.mfaMethod ?? null}
          hasPhoneNumber={!!user.phoneNumber}
        />
      </Panel>

      {!user.phoneNumber ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          No phone number on file — text-message codes aren&apos;t available until one is added. Contact a super admin to add one.
        </p>
      ) : null}
    </div>
  );
}
