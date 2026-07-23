"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/types/permissions";
import { useToast } from "@/lib/hooks/use-toast";

const ALL_ACTIONS = Object.keys(PERMISSION_ACTION_LABELS) as PermissionActionKey[];

export function GroupPermissions({ group }: { group: PermissionGroup }) {
  const { data: detail, refetch } = usePermissionGroup(group.id);
  const grant = useGrantPermission();
  const revoke = useRevokePermission();
  const { toast } = useToast();

  if (!detail) return <Skeleton className="h-40" />;

  // detail.grants includes revoked history too, and is keyed by raw
  // resource_type/action columns, not the composite PermissionActionKey used
  // in the UI — only active grants map to a checkbox via permission_key.
  const grantedActions = new Map(
    detail.grants
      .filter((g) => g.is_granted && g.permission_key)
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
    } else {
      grant.mutate(
        { groupId: group.id, action },
        {
          onSuccess: () => {
            toast({ title: `Granted "${PERMISSION_ACTION_LABELS[action]}" for ${group.name}` });
            refetch();
          },
          onError: (error: unknown) =>
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : undefined,
              variant: "destructive",
            }),
        }
      );
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Atomic Permissions
        </p>
        {ALL_ACTIONS.map((action) => {
          const checked = grantedActions.has(action);
          return (
            <label key={action} className="flex items-start gap-3 cursor-pointer group/perm">
              <Checkbox
                checked={checked}
                onCheckedChange={() => togglePermission(action)}
                disabled={grant.isPending || revoke.isPending}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium group-hover/perm:text-primary transition-colors">
                  {PERMISSION_ACTION_LABELS[action]}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {PERMISSION_ACTION_DESCRIPTIONS[action]}
                </p>
              </div>
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Created {formatDate(detail.created_at)}</p>
    </>
  );
}
