"use client";

import { useState } from "react";
import { Ban, ChevronDown, ChevronUp, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGroupForm } from "@/components/admin/permission-group-form";
import { MemberManager } from "@/components/admin/member-manager";
import { GroupPermissions } from "@/components/admin/group-permissions";
import {
  usePermissionGroups,
  usePermissionMatrix,
  useCreatePermissionGroup,
  useUpdatePermissionGroup,
  useDeactivatePermissionGroup,
  useDeletePermissionGroup,
} from "@/lib/hooks/usePermissionGroups";
import type { PermissionGroup } from "@/lib/api/permissions";
import { PERMISSION_ACTION_LABELS } from "@/types/permissions";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";

export function PermissionGroupsPanel() {
  const { data: groups, isLoading } = usePermissionGroups();
  const { data: matrix } = usePermissionMatrix();
  const createGroup = useCreatePermissionGroup();
  const updateGroup = useUpdatePermissionGroup();
  const deactivateGroup = useDeactivatePermissionGroup();
  const deleteGroup = useDeletePermissionGroup();
  const { toast } = useToast();

  const [formTarget, setFormTarget] = useState<PermissionGroup | "new" | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {!formTarget && (
          <Button onClick={() => setFormTarget("new")} size="sm">
            <Plus className="size-4 mr-1.5" />
            New Group
          </Button>
        )}
      </div>

      {formTarget && (
        <PermissionGroupForm
          initial={formTarget === "new" ? undefined : formTarget}
          onCancel={() => setFormTarget(null)}
          isSaving={createGroup.isPending || updateGroup.isPending}
          onSave={(payload) => {
            if (formTarget === "new") {
              createGroup.mutate(payload, {
                onSuccess: () => {
                  toast({ title: "Group created" });
                  setFormTarget(null);
                },
                onError: (error: unknown) =>
                  toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : undefined,
                    variant: "destructive",
                  }),
              });
            } else {
              updateGroup.mutate(
                { id: formTarget.id, payload },
                {
                  onSuccess: () => {
                    toast({ title: "Group updated" });
                    setFormTarget(null);
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
          }}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : !groups || groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No permission groups yet. Create one to start delegating permissions.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isOpen = expanded === group.id;
            return (
              <Card key={group.id} className={cn(isOpen && "ring-1 ring-primary/20")}>
                <CardHeader className="pb-3">
                  <div className="flex w-full items-start justify-between gap-3">
                    <button
                      type="button"
                      className="flex flex-1 items-start gap-3 text-left"
                      onClick={() => toggleExpand(group.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        {group.description && (
                          <CardDescription className="mt-0.5">{group.description}</CardDescription>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="text-xs">{group.member_count} members</Badge>
                          {!group.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                          {(matrix?.delegations.find((d) => d.id === group.id)?.actions ?? []).map((action) => (
                            <Badge key={action} variant="outline" className="text-xs">
                              {PERMISSION_ACTION_LABELS[action]}
                            </Badge>
                          ))}
                          {group.grant_count === 0 && (
                            <span className="text-xs text-muted-foreground italic">No delegated permissions</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground shrink-0"
                      onClick={() => setFormTarget(group)}
                      aria-label="Edit group"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {group.is_active ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground shrink-0"
                        onClick={() => setPendingDeactivate(group.id)}
                        aria-label="Deactivate group"
                        title="Deactivate group"
                      >
                        <Ban className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground shrink-0"
                        onClick={() =>
                          updateGroup.mutate(
                            { id: group.id, payload: { isActive: true } },
                            { onSuccess: () => toast({ title: "Group reactivated" }) }
                          )
                        }
                        aria-label="Reactivate group"
                        title="Reactivate group"
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setPendingDelete(group.id)}
                      aria-label="Delete group"
                      title="Permanently delete group"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardContent className="pt-0 space-y-5">
                    <GroupPermissions group={group} />
                    <div className="border-t pt-4">
                      <MemberManager groupId={group.id} />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeactivate}
        onOpenChange={(open) => !open && setPendingDeactivate(null)}
        title="Deactivate this group?"
        description="The group and its delegated permissions will stop applying to its members. You can reactivate it later."
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deactivateGroup.isPending}
        onConfirm={() => {
          if (!pendingDeactivate) return;
          deactivateGroup.mutate(pendingDeactivate, {
            onSuccess: () => {
              toast({ title: "Group deactivated" });
              setPendingDeactivate(null);
            },
            onError: (error: unknown) =>
              toast({
                title: "Error",
                description: error instanceof Error ? error.message : undefined,
                variant: "destructive",
              }),
          });
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Permanently delete this group?"
        description="This removes the group, its members, and its delegated permissions for good. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteGroup.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteGroup.mutate(pendingDelete, {
            onSuccess: () => {
              toast({ title: "Group deleted" });
              setPendingDelete(null);
            },
            onError: (error: unknown) =>
              toast({
                title: "Can't delete this group",
                description: error instanceof Error ? error.message : undefined,
                variant: "destructive",
              }),
          });
        }}
      />
    </div>
  );
}
