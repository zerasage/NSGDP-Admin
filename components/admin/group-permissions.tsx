"use client";

import { useState } from "react";
import { Database, Building2, Users, FolderKanban, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
  const [bulkPendingSection, setBulkPendingSection] = useState<string | null>(null);

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

  // "Select All" grants every ungranted action in the section; if the
  // section is already fully granted, it flips to "Clear All" and revokes
  // everything instead — same select-all/clear-all convention used for the
  // LGA checklist elsewhere in this app.
  const toggleSection = async (sectionLabel: string, actions: PermissionActionKey[]) => {
    const allGranted = actions.every((action) => grantedActions.has(action));
    setBulkPendingSection(sectionLabel);

    try {
      if (allGranted) {
        await Promise.all(
          actions.map((action) => {
            const grantId = grantedActions.get(action);
            return grantId ? revoke.mutateAsync({ groupId: group.id, grantId }) : Promise.resolve();
          })
        );
        toast({ title: `Cleared all "${sectionLabel}" permissions for ${group.name}` });
      } else {
        const missing = actions.filter((action) => !grantedActions.has(action));
        await Promise.all(
          missing.map((action) => grant.mutateAsync({ groupId: group.id, action }))
        );
        toast({ title: `Granted all "${sectionLabel}" permissions for ${group.name}` });
      }
      await refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update permissions",
        variant: "destructive",
      });
    } finally {
      setBulkPendingSection(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-muted/30 p-4 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Atomic Permissions
        </p>
        {PERMISSION_ACTION_GROUPS.map((section, groupIndex) => {
          const GroupIcon = GROUP_ICONS[section.label];
          const allGranted = section.actions.every((action) => grantedActions.has(action));
          const isBulkPending = bulkPendingSection === section.label;
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-medium"
                  disabled={isBulkPending || grant.isPending || revoke.isPending}
                  onClick={() => toggleSection(section.label, section.actions)}
                >
                  {allGranted ? "Clear All" : "Select All"}
                </Button>
              </div>
              {section.actions.map((action) => {
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
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Created {formatDate(detail.created_at)}</p>
    </>
  );
}
