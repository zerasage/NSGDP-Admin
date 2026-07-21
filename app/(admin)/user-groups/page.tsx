"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, UserPlus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  usePermissionGroups,
  usePermissionGroup,
  usePermissionMatrix,
  useCreatePermissionGroup,
  useUpdatePermissionGroup,
  useDeletePermissionGroup,
  useAddGroupMember,
  useRemoveGroupMember,
} from "@/lib/hooks/usePermissionGroups";
import type { PermissionGroup } from "@/lib/api/permissions";
import { PERMISSION_ACTION_LABELS } from "@/types/permissions";
import { useUsers } from "@/lib/hooks/useAdmin";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";

function MemberManager({ groupId }: { groupId: string }) {
  const { data: group, isLoading } = usePermissionGroup(groupId);
  const [search, setSearch] = useState("");
  const { data: userResults } = useUsers({ search, limit: 5 });
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const { toast } = useToast();

  if (isLoading || !group) {
    return <Skeleton className="h-24" />;
  }

  const existingIds = new Set(group.members.map((m) => m.user_id));

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Members ({group.members.length})
        </p>
        {group.members.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No members yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {group.members.map((member) => (
              <li key={member.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{member.first_name} {member.last_name}</span>
                  <span className="text-muted-foreground ml-2">{member.email}</span>
                  <Badge variant="outline" className="ml-2 text-xs capitalize">{member.role}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    removeMember.mutate(
                      { groupId, userId: member.user_id },
                      { onSuccess: () => toast({ title: "Member removed" }) }
                    )
                  }
                  disabled={removeMember.isPending}
                  aria-label="Remove member"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add member</p>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="mb-2"
        />
        {search.length > 1 && (
          <ul className="space-y-1.5">
            {(userResults?.data ?? [])
              .filter((u) => !existingIds.has(u.id))
              .map((user) => (
                <li key={user.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{user.first_name} {user.last_name}</span>
                    <span className="text-muted-foreground ml-2">{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      addMember.mutate(
                        { groupId, userId: user.id },
                        { onSuccess: () => { setSearch(""); toast({ title: "Member added" }); } }
                      )
                    }
                    disabled={addMember.isPending}
                  >
                    <UserPlus className="size-3.5 mr-1" />
                    Add
                  </Button>
                </li>
              ))}
            {(userResults?.data ?? []).filter((u) => !existingIds.has(u.id)).length === 0 && (
              <p className="text-sm text-muted-foreground italic">No matching users.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function UserGroupsPage() {
  const { data: groups, isLoading } = usePermissionGroups();
  const { data: matrix } = usePermissionMatrix();
  const createGroup = useCreatePermissionGroup();
  const updateGroup = useUpdatePermissionGroup();
  const deleteGroup = useDeletePermissionGroup();
  const { toast } = useToast();

  const [formTarget, setFormTarget] = useState<PermissionGroup | "new" | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UsersRound className="size-5" />
            User Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Groups of users who can be granted delegated permissions together. Manage delegated
            permissions on the Permissions page.
          </p>
        </div>
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
            No user groups yet. Create one to start delegating permissions.
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setPendingDelete(group.id)}
                      aria-label="Delete group"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardContent className="pt-0">
                    <MemberManager groupId={group.id} />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Deactivate this group?"
        description="The group and its delegated permissions will stop applying to its members. This can't be undone from here."
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deleteGroup.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteGroup.mutate(pendingDelete, {
            onSuccess: () => toast({ title: "Group deactivated" }),
          });
        }}
      />
    </div>
  );
}
