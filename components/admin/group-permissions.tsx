"use client";

import { useState } from "react";
import { Database, Building2, Users, FolderKanban, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils/date";
import type { PermissionGroup, PermissionActionKey } from "@/lib/api/permissions";
import {
  usePermissionGroup,
  useGrantPermission,
  useRevokePermission,
} from "@/lib/hooks/usePermissionGroups";
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_ACTION_DESCRIPTIONS,
  PERMISSION_ACTION_GROUPS,
  isPowerfulPermission,
} from "@/types/permissions";
import { useToast } from "@/lib/hooks/use-toast";

const GROUP_ICONS: Record<string, typeof Database> = {
  Datasets: Database,
  Organisations: Building2,
  Users: Users,
  Programmes: FolderKanban,
  "Access Requests": UserCheck,
};

export function GroupPermissions({ group }: { group: PermissionGroup }) {
  const { data: detail, refetch } = usePermissionGroup(group.id);
  const grant = useGrantPermission();
  const revoke = useRevokePermission();
  const { toast } = useToast();
  const [pendingPowerful, setPendingPowerful] = useState<PermissionActionKey | null>(null);

  if (!detail) return <Skeleton className="h-40" />;

  // detail.grants includes revoked history too, and is keyed by raw
  // resource_type/action columns, not the composite PermissionActionKey used
  // in the UI — only active grants map to a checkbox via permission_key.
  const grantedActions = new Map(
    detail.grants
      .filter((g) => g.is_granted && g.permission_key && (!g.expires_at || new Date(g.expires_at) > new Date()))
      .map((g) => [g.permission_key as PermissionActionKey, g.id] as const)
  );

  const togglePermission = (action: PermissionActionKey) => {
    const existingGrantId = grantedActions.get(action);

    if (existingGrantId) {
      revoke.mutate(
        { groupId: group.id, grantId: existingGrantId },
        {
          onSuccess: () => {
            toast({ title: `Revoked "${PERMISSION_ACTION_LABELS[action]}" for ${group.name}` });
            refetch();
          },
        }
      );
    } else if (isPowerfulPermission(action)) {
      setPendingPowerful(action);
    } else {
      grantAction(action);
    }
  };

  const grantAction = (action: PermissionActionKey, onSuccess?: () => void) => {
      grant.mutate(
        { groupId: group.id, action },
        {
          onSuccess: () => {
            toast({ title: `Granted "${PERMISSION_ACTION_LABELS[action]}" for ${group.name}` });
            refetch();
            onSuccess?.();
          },
          onError: (error: unknown) =>
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : undefined,
              variant: "destructive",
            }),
        }
      );
  };

  return (
    <>
      <div className="rounded-lg border bg-muted/30 p-4 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Atomic Permissions
        </p>
        {PERMISSION_ACTION_GROUPS.map((section, groupIndex) => {
          const GroupIcon = GROUP_ICONS[section.label];
          return (
            <div
              key={section.label}
              className={groupIndex > 0 ? "space-y-3 border-t pt-4" : "space-y-3"}
            >
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80">
                  {GroupIcon && <GroupIcon className="size-3.5" />}
                  {section.label}
                </p>
              </div>
              {section.actions.map((action) => {
                const checked = grantedActions.has(action);
                return (
                  <label key={action} className="flex items-start gap-3 cursor-pointer group/perm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => togglePermission(action)}
                      disabled={!group.is_active || grant.isPending || revoke.isPending}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium group-hover/perm:text-primary transition-colors">
                        {PERMISSION_ACTION_LABELS[action]}
                        {isPowerfulPermission(action) && <span className="ml-2 rounded border border-amber-500 px-1.5 py-0.5 text-xs text-amber-700">Powerful</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {PERMISSION_ACTION_DESCRIPTIONS[action]}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
      {!group.is_active && <p className="mt-3 border-l-4 border-amber-500 pl-3 text-sm">This group is inactive and read-only. Configured permissions confer no access.</p>}
      <p className="mt-3 text-xs text-muted-foreground">Created {formatDate(detail.created_at)}</p>
      <ConfirmDialog open={!!pendingPowerful} onOpenChange={(open) => !open && setPendingPowerful(null)}
        title="Grant powerful permission?" description={`This grants ${pendingPowerful ? PERMISSION_ACTION_LABELS[pendingPowerful] : "a powerful action"} to every active member of ${group.name}. Grant only to vetted staff.`}
        confirmLabel="Grant permission" loading={grant.isPending} closeOnConfirm={false}
        onConfirm={() => { if (pendingPowerful) grantAction(pendingPowerful, () => setPendingPowerful(null)); }} />
    </>
  );
}
