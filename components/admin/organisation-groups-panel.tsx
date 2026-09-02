"use client";

import { useState } from "react";
import { Building2, ChevronLeft, Network, Settings, Shield, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { OrganisationGroupForm } from "./organisation-group-form";
import { OrganisationGroupMemberManager } from "./organisation-group-member-manager";
import { OrganisationGroupCapabilities } from "./organisation-group-capabilities";
import {
  useOrganisationGroups,
  useCreateOrganisationGroup,
  useUpdateOrganisationGroup,
  useDeactivateOrganisationGroup,
  useDeleteOrganisationGroup,
} from "@/lib/hooks/useOrganisationGroups";
import {
  METRIC_TONE,
  tabToneClass,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import {
  AdminSectionTabsNav,
  ADMIN_TAB_TRIGGER_BASE,
} from "@/components/admin/admin-section-tabs-nav";
import { HelpTip } from "@/components/admin/help-tip";
import {
  ORG_GROUPS_CAPABILITIES_TAB_TIP,
  ORG_GROUPS_MEMBERS_TAB_TIP,
} from "@/lib/constants/organisation-groups-tooltips";
import { useToast } from "@/lib/hooks/use-toast";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

interface OrganisationGroupsPanelProps {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

function GroupStatusBadge({ active }: { active: boolean }) {
  const tone: MetricTone = active ? "success" : "muted";
  const t = METRIC_TONE[tone];
  return (
    <Badge variant="outline" className={cn("border text-xs", t.well, t.icon)}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

export function OrganisationGroupsPanel({ createOpen, onCreateOpenChange }: OrganisationGroupsPanelProps) {
  const { data: groups, isLoading } = useOrganisationGroups();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState("members");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const create = useCreateOrganisationGroup();
  const update = useUpdateOrganisationGroup();
  const deactivate = useDeactivateOrganisationGroup();
  const deleteGroup = useDeleteOrganisationGroup();
  const { toast } = useToast();

  const handleCreate = (payload: { name: string; description?: string }) => {
    create.mutate(payload, {
      onSuccess: (created) => {
        toast({ title: `Created group "${created.name}"` });
        onCreateOpenChange(false);
        setSelectedId(created.id);
      },
      onError: (error: unknown) =>
        toast({
          title: "Couldn&apos;t create group",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        }),
    });
  };

  const handleUpdate = (id: string, payload: { name: string; description?: string }) => {
    update.mutate(
      { id, payload },
      {
        onSuccess: (updated) => {
          toast({ title: `Updated group "${updated.name}"` });
          setEditingId(null);
        },
        onError: (error: unknown) =>
          toast({
            title: "Couldn&apos;t update group",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  const handleDeactivate = () => {
    if (!deactivatingId) return;
    deactivate.mutate(deactivatingId, {
      onSuccess: (updated) => {
        toast({ title: `Deactivated group "${updated.name}"` });
        setDeactivatingId(null);
      },
      onError: (error: unknown) => {
        toast({
          title: "Couldn&apos;t deactivate group",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
        setDeactivatingId(null);
      },
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    const group = groups?.find((g) => g.id === deletingId);
    deleteGroup.mutate(deletingId, {
      onSuccess: () => {
        toast({ title: `Deleted group "${group?.name ?? "Unknown"}"` });
        setDeletingId(null);
        if (selectedId === deletingId) setSelectedId(null);
      },
      onError: (error: unknown) => {
        toast({
          title: "Couldn&apos;t delete group",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
        setDeletingId(null);
      },
    });
  };

  const selectedGroup = groups?.find((g) => g.id === selectedId);
  const editingGroup = groups?.find((g) => g.id === editingId);
  const deactivatingGroup = groups?.find((g) => g.id === deactivatingId);
  const deletingGroup = groups?.find((g) => g.id === deletingId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div>
        {createOpen ? (
          <OrganisationGroupForm
            onSave={handleCreate}
            onCancel={() => onCreateOpenChange(false)}
            isSaving={create.isPending}
          />
        ) : (
          <EmptyState
            icon={Network}
            title="No organisation groups yet"
            description="Create groups to grant capabilities to multiple organisations at once."
            action={{ label: "New group", onClick: () => onCreateOpenChange(true) }}
          />
        )}
      </div>
    );
  }

  if (createOpen) {
    return (
      <OrganisationGroupForm
        onSave={handleCreate}
        onCancel={() => onCreateOpenChange(false)}
        isSaving={create.isPending}
      />
    );
  }

  if (editingId && editingGroup) {
    return (
      <OrganisationGroupForm
        initial={editingGroup}
        onSave={(payload) => handleUpdate(editingId, payload)}
        onCancel={() => setEditingId(null)}
        isSaving={update.isPending}
      />
    );
  }

  if (!selectedId || !selectedGroup) {
    return (
      <div className="space-y-3">
        {groups.map((group) => {
          const tone: MetricTone = group.is_active ? "success" : "muted";
          const t = METRIC_TONE[tone];
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedId(group.id)}
              className={cn(
                "w-full rounded-2xl border p-4 text-left transition-colors hover:brightness-[0.98]",
                t.card,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg border",
                      t.well,
                    )}
                  >
                    <Building2 className={cn("size-5", t.icon)} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{group.name}</p>
                    {group.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {group.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" aria-hidden />
                        {group.member_count} {group.member_count === 1 ? "member" : "members"}
                      </span>
                      <span aria-hidden>•</span>
                      <span>Created {formatDate(group.created_at)}</span>
                    </div>
                  </div>
                </div>
                <GroupStatusBadge active={group.is_active} />
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedId(null)}
          className="h-9 gap-1 px-2"
        >
          <ChevronLeft className="size-4" />
          Back to list
        </Button>

        <div className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold">{selectedGroup.name}</h3>
                <GroupStatusBadge active={selectedGroup.is_active} />
              </div>
              {selectedGroup.description && (
                <p className="mt-1 text-sm text-muted-foreground">{selectedGroup.description}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedGroup.member_count} members · Created {formatDate(selectedGroup.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setEditingId(selectedGroup.id)}
              >
                <Settings className="size-4" />
                Edit
              </Button>
              {selectedGroup.is_active && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setDeactivatingId(selectedGroup.id)}
                >
                  <X className="size-4" />
                  Deactivate
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeletingId(selectedGroup.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={detailTab} onValueChange={(value) => value && setDetailTab(value)} className="w-full">
          <AdminSectionTabsNav>
            <div className="inline-flex flex-none items-center gap-0.5">
              <TabsTrigger
                value="members"
                className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("info"))}
              >
                <Users className="size-3.5 shrink-0 sm:size-4" />
                Members
              </TabsTrigger>
              {detailTab === "members" ? (
                <HelpTip content={ORG_GROUPS_MEMBERS_TAB_TIP} label="About members tab" />
              ) : null}
            </div>
            <div className="inline-flex flex-none items-center gap-0.5">
              <TabsTrigger
                value="capabilities"
                className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("success"))}
              >
                <Shield className="size-3.5 shrink-0 sm:size-4" />
                Capabilities
              </TabsTrigger>
              {detailTab === "capabilities" ? (
                <HelpTip content={ORG_GROUPS_CAPABILITIES_TAB_TIP} label="About capabilities tab" />
              ) : null}
            </div>
          </AdminSectionTabsNav>
          <TabsContent value="members" className="mt-4 space-y-4">
            <OrganisationGroupMemberManager
              groupId={selectedGroup.id}
              disabled={!selectedGroup.is_active}
            />
          </TabsContent>
          <TabsContent value="capabilities" className="mt-4 space-y-4">
            <OrganisationGroupCapabilities group={selectedGroup} />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={!!deactivatingId}
        onOpenChange={(open) => !open && setDeactivatingId(null)}
        title="Deactivate group?"
        description={`Deactivating "${deactivatingGroup?.name}" will prevent all member organisations from using granted capabilities. Members are preserved and the group can be reactivated later.`}
        confirmLabel="Deactivate"
        loading={deactivate.isPending}
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete group permanently?"
        description={`Deleting "${deletingGroup?.name}" will permanently remove the group, all memberships, and capability grants. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteGroup.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
