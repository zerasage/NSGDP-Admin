"use client";

import { useState } from "react";
import { Shield, ChevronDown, ChevronUp, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { UserGroup, PermissionAction } from "@/types/permissions";
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_ACTION_DESCRIPTIONS,
} from "@/types/permissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALL_ACTIONS = Object.keys(PERMISSION_ACTION_LABELS) as PermissionAction[];

interface PermissionDelegationPanelProps {
  groups: UserGroup[];
  onGroupsChange: (groups: UserGroup[]) => void;
  onCreateGroup: () => void;
}

export function PermissionDelegationPanel({
  groups,
  onGroupsChange,
  onCreateGroup,
}: PermissionDelegationPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(groups.slice(0, 1).map((g) => g.id)));

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePermission = (groupId: string, action: PermissionAction) => {
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      const has = g.delegatedPermissions.includes(action);
      const delegatedPermissions = has
        ? g.delegatedPermissions.filter((a) => a !== action)
        : [...g.delegatedPermissions, action];
      return { ...g, delegatedPermissions };
    });
    onGroupsChange(updated);
    const group = groups.find((g) => g.id === groupId);
    const added = !group?.delegatedPermissions.includes(action);
    toast.success(
      `${added ? "Granted" : "Revoked"} "${PERMISSION_ACTION_LABELS[action]}" for ${group?.name}`
    );
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
        <Button onClick={onCreateGroup} size="sm">
          <Plus className="size-4 mr-1.5" />
          New Group
        </Button>
      </div>

      {groups.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No user groups found. Create one to start delegating permissions.
          </CardContent>
        </Card>
      )}

      {groups.map((group) => {
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
                      {group.delegatedPermissions.length > 0 ? (
                        group.delegatedPermissions.map((a) => (
                          <Badge key={a} variant="secondary" className="text-xs">
                            <Check className="size-2.5 mr-1" />
                            {PERMISSION_ACTION_LABELS[a]}
                          </Badge>
                        ))
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
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Atomic Permissions
                  </p>
                  {ALL_ACTIONS.map((action) => {
                    const checked = group.delegatedPermissions.includes(action);
                    return (
                      <label
                        key={action}
                        className="flex items-start gap-3 cursor-pointer group/perm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => togglePermission(group.id, action)}
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
                  {group.memberIds.length} member{group.memberIds.length !== 1 ? "s" : ""} in this group · Created {new Date(group.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
