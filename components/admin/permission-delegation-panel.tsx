"use client";

import { useState } from "react";
import { Shield, ChevronDown, ChevronUp, Check, Plus } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PermissionGroup, PermissionActionKey } from "@/lib/api/permissions";
import {
  usePermissionGroups,
  usePermissionGroup,
  useGrantPermission,
  useRevokePermission,
} from "@/lib/hooks/usePermissionGroups";
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_ACTION_DESCRIPTIONS,
} from "@/types/permissions";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";

const ALL_ACTIONS = Object.keys(PERMISSION_ACTION_LABELS) as PermissionActionKey[];

function GroupPermissions({ group }: { group: PermissionGroup }) {
  const { data: detail } = usePermissionGroup(group.id);
  const grant = useGrantPermission();
  const revoke = useRevokePermission();
  const { toast } = useToast();

  if (!detail) return <Skeleton className="h-40" />;

  const grantedActions = new Map(
    detail.grants.filter((g) => g.is_granted).map((g) => [g.action, g.id] as const)
  );

  const togglePermission = (action: PermissionActionKey) => {
    const existingGrantId = grantedActions.get(action);
    if (existingGrantId) {
      revoke.mutate(
        { groupId: group.id, grantId: existingGrantId },
        {
          onSuccess: () =>
            toast({ title: `Revoked "${PERMISSION_ACTION_LABELS[action]}" for ${group.name}` }),
        }
      );
    } else {
      grant.mutate(
        { groupId: group.id, action },
        {
          onSuccess: () =>
            toast({ title: `Granted "${PERMISSION_ACTION_LABELS[action]}" for ${group.name}` }),
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
      <p className="mt-3 text-xs text-muted-foreground">
        {detail.members.length} member{detail.members.length !== 1 ? "s" : ""} in this group ·{" "}
        <Link href="/user-groups" className="underline">
          Manage members
        </Link>{" "}
        · Created{" "}
        {new Date(detail.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </>
  );
}

export function PermissionDelegationPanel() {
  const { data: groups, isLoading } = usePermissionGroups();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Permission Delegation</h2>
          <p className="text-sm text-muted-foreground">
            Grant additional permissions to user groups beyond their base role.
          </p>
        </div>
        <Link href="/user-groups" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="size-4 mr-1.5" />
          New Group
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : !groups || groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No user groups found. Create one to start delegating permissions.
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => {
          const isOpen = expanded.has(group.id);
          return (
            <Card key={group.id} className={cn(isOpen && "ring-1 ring-primary/20")}>
              <CardHeader className="pb-3">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => toggleExpand(group.id)}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="size-4 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      {group.description && (
                        <CardDescription className="mt-0.5 line-clamp-1">
                          {group.description}
                        </CardDescription>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {group.grant_count > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="size-2.5 mr-1" />
                            {group.grant_count} permission{group.grant_count !== 1 ? "s" : ""} granted
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No delegated permissions</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="size-4 shrink-0 text-muted-foreground mt-1" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground mt-1" />
                  )}
                </button>
              </CardHeader>

              {isOpen && (
                <CardContent className="pt-0">
                  <GroupPermissions group={group} />
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
