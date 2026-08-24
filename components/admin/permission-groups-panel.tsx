"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Ban, Ellipsis, KeyRound, Pencil, RotateCcw, Shield, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { GroupPermissions } from "@/components/admin/group-permissions";
import { MemberManager } from "@/components/admin/member-manager";
import { PermissionGroupForm } from "@/components/admin/permission-group-form";
import type { PermissionGroup } from "@/lib/api/permissions";
import {
  METRIC_TONE,
  tabToneClass,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import {
  AdminSectionTabsNav,
  ADMIN_TAB_TRIGGER_BASE,
} from "@/components/admin/admin-section-tabs-nav";
import { useToast } from "@/lib/hooks/use-toast";
import {
  useCreatePermissionGroup,
  useDeactivatePermissionGroup,
  useDeletePermissionGroup,
  usePermissionGroups,
  useUpdatePermissionGroup,
} from "@/lib/hooks/usePermissionGroups";
import { cn } from "@/lib/utils";

function GroupStatusBadge({ active }: { active: boolean }) {
  const tone: MetricTone = active ? "success" : "muted";
  const t = METRIC_TONE[tone];
  return (
    <Badge variant="outline" className={cn("shrink-0 border text-xs", t.well, t.icon)}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function PanelState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center">
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function PermissionGroupsPanel({
  createOpen,
  onCreateOpenChange,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const { data: groups, isLoading, isError, refetch } = usePermissionGroups();
  const createGroup = useCreatePermissionGroup();
  const updateGroup = useUpdatePermissionGroup();
  const deactivateGroup = useDeactivatePermissionGroup();
  const deleteGroup = useDeletePermissionGroup();
  const { toast } = useToast();
  const [formTarget, setFormTarget] = useState<PermissionGroup | "new" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingReactivate, setPendingReactivate] = useState<string | null>(null);

  const selected = groups?.find((group) => group.id === selectedId) ?? groups?.[0] ?? null;
  const effectiveSelectedId = selected?.id ?? null;
  const deactivationTarget = groups?.find((group) => group.id === pendingDeactivate);
  const activeFormTarget = createOpen ? "new" : formTarget;

  const errorToast = (error: unknown, title = "Error") =>
    toast({
      title,
      description: error instanceof Error ? error.message : undefined,
      variant: "destructive",
    });

  const closeForm = () => {
    setFormTarget(null);
    onCreateOpenChange(false);
  };

  return (
    <div className="space-y-4">
      {activeFormTarget && (
        <PermissionGroupForm
          initial={activeFormTarget === "new" ? undefined : activeFormTarget}
          onCancel={closeForm}
          isSaving={createGroup.isPending || updateGroup.isPending}
          onSave={(payload) => {
            const done = () => {
              toast({ title: activeFormTarget === "new" ? "Group created" : "Group updated" });
              closeForm();
            };
            if (activeFormTarget === "new") {
              createGroup.mutate(payload, { onSuccess: done, onError: (error) => errorToast(error) });
            } else {
              updateGroup.mutate(
                { id: activeFormTarget.id, payload },
                { onSuccess: done, onError: (error) => errorToast(error) },
              );
            }
          }}
        />
      )}

      {isError ? (
        <PanelState title="Permission groups could not be loaded.">
          <Button variant="outline" className="h-11" onClick={() => refetch()}>
            Try again
          </Button>
        </PanelState>
      ) : isLoading ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(280px,.8fr)_minmax(0,1.4fr)]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : !groups?.length ? (
        <PanelState
          title="No permission groups yet."
          description="Create one to start delegating permissions."
        />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(280px,.8fr)_minmax(0,1.4fr)]">
          <div
            className="overflow-hidden rounded-2xl border bg-card"
            role="listbox"
            aria-label="Permission groups"
          >
            {groups.map((group) => {
              const selectedRow = effectiveSelectedId === group.id;
              const tone: MetricTone = group.is_active ? "success" : "muted";
              const t = METRIC_TONE[tone];
              return (
                <button
                  key={group.id}
                  type="button"
                  role="option"
                  aria-selected={selectedRow}
                  onClick={() => setSelectedId(group.id)}
                  className={cn(
                    "block min-h-20 w-full border-b p-4 text-left last:border-b-0 transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    selectedRow ? cn("bg-primary/5", t.card) : "hover:bg-muted/30",
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{group.name}</span>
                      <span className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {group.description || "No description"}
                      </span>
                    </span>
                    <GroupStatusBadge active={group.is_active} />
                  </span>
                  <span className="mt-2 flex gap-2 text-xs text-muted-foreground">
                    <span>{group.member_count} members</span>
                    <span aria-hidden="true">·</span>
                    <span>{group.grant_count} permissions</span>
                  </span>
                </button>
              );
            })}
          </div>

          {selected ? (
            <section className="overflow-hidden rounded-2xl border bg-card" aria-labelledby="selected-group-title">
              <div className="flex items-start justify-between gap-3 border-b p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="selected-group-title" className="text-lg font-semibold">
                      {selected.name}
                    </h2>
                    <GroupStatusBadge active={selected.is_active} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.description || "No description provided."}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-11 shrink-0"
                        aria-label={`Actions for ${selected.name}`}
                      />
                    }
                  >
                    <Ellipsis className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Group lifecycle</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          onCreateOpenChange(false);
                          setFormTarget(selected);
                        }}
                      >
                        <Pencil />
                        Edit group
                      </DropdownMenuItem>
                      {selected.is_active ? (
                        <DropdownMenuItem onClick={() => setPendingDeactivate(selected.id)}>
                          <Ban />
                          Deactivate group and accounts
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setPendingReactivate(selected.id)}>
                          <RotateCcw />
                          Reactivate group
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={selected.member_count > 0}
                        onClick={() => setPendingDelete(selected.id)}
                      >
                        <Trash2 />
                        {selected.member_count > 0
                          ? "Move members before deleting"
                          : "Permanently delete"}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {!selected.is_active && (
                <div className="border-b border-warning/30 bg-warning/10 px-4 py-3 text-sm text-muted-foreground">
                  This group is inactive. Permission and membership changes are disabled.
                </div>
              )}

              <Tabs defaultValue="permissions" className="gap-0">
                <div className="border-b p-3">
                  <AdminSectionTabsNav>
                    <TabsTrigger
                      value="permissions"
                      className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("success"))}
                    >
                      <Shield className="size-3.5 shrink-0 sm:size-4" />
                      Permissions
                      <Badge variant="outline" className="ml-1 tabular-nums">
                        {selected.grant_count}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="members"
                      className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("info"))}
                    >
                      <Users className="size-3.5 shrink-0 sm:size-4" />
                      Members
                      <Badge variant="outline" className="ml-1 tabular-nums">
                        {selected.member_count}
                      </Badge>
                    </TabsTrigger>
                  </AdminSectionTabsNav>
                </div>
                <TabsContent value="permissions" className="p-4">
                  <GroupPermissions group={selected} />
                </TabsContent>
                <TabsContent value="members" className="p-4">
                  <MemberManager groupId={selected.id} disabled={!selected.is_active} />
                </TabsContent>
              </Tabs>
            </section>
          ) : (
            <PanelState
              title="Choose a group"
              description="Select a group to inspect its permissions and members."
            />
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeactivate}
        onOpenChange={(open) => !open && setPendingDeactivate(null)}
        title="Deactivate group and staff access?"
        description={`This disables the group and immediately signs out its ${deactivationTarget?.member_count ?? 0} linked staff member${deactivationTarget?.member_count === 1 ? "" : "s"}, blocking sign-in until the group is reactivated. Their account status and any independent suspension are unaffected — this only gates access, it never changes an account's own status.`}
        confirmLabel="Deactivate group and accounts"
        variant="destructive"
        loading={deactivateGroup.isPending}
        closeOnConfirm={false}
        onConfirm={() =>
          pendingDeactivate &&
          deactivateGroup.mutate(pendingDeactivate, {
            onSuccess: () => {
              toast({ title: "Group and linked staff accounts deactivated" });
              setPendingDeactivate(null);
            },
            onError: (error) => errorToast(error),
          })
        }
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Permanently delete this empty group?"
        description="This permanently removes the group and its delegated permissions. Invite history may still block deletion. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteGroup.isPending}
        closeOnConfirm={false}
        onConfirm={() =>
          pendingDelete &&
          deleteGroup.mutate(pendingDelete, {
            onSuccess: () => {
              toast({ title: "Group deleted" });
              setPendingDelete(null);
            },
            onError: (error) => errorToast(error, "Can't delete this group"),
          })
        }
      />

      <ConfirmDialog
        open={!!pendingReactivate}
        onOpenChange={(open) => !open && setPendingReactivate(null)}
        title="Reactivate group and staff access?"
        description="Sign-in access is restored for this group's staff members. Anyone independently suspended stays suspended until an admin reactivates them individually."
        confirmLabel="Reactivate group and accounts"
        loading={updateGroup.isPending}
        closeOnConfirm={false}
        onConfirm={() =>
          pendingReactivate &&
          updateGroup.mutate(
            { id: pendingReactivate, payload: { isActive: true } },
            {
              onSuccess: () => {
                toast({ title: "Group and linked staff accounts reactivated" });
                setPendingReactivate(null);
              },
              onError: (error) => errorToast(error),
            },
          )
        }
      />
    </div>
  );
}
