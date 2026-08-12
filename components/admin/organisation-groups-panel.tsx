"use client";

import { useState } from "react";
import { Building2, X, Settings, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { useToast } from "@/lib/hooks/use-toast";
import { formatDate } from "@/lib/utils/date";

interface OrganisationGroupsPanelProps {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function OrganisationGroupsPanel({ createOpen, onCreateOpenChange }: OrganisationGroupsPanelProps) {
  const { data: groups, isLoading } = useOrganisationGroups();
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      }
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
    return <Skeleton className="h-40" />;
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
          <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
            <Building2 className="mx-auto size-12 text-muted-foreground" />
            <p className="mt-3 font-semibold">No organisation groups yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create groups to grant capabilities to multiple organisations at once.
            </p>
          </div>
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
      <div className="space-y-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedId(group.id)}
            className="w-full rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{group.name}</p>
                {group.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{group.member_count} members</span>
                  <span>•</span>
                  <span>Created {formatDate(group.created_at)}</span>
                </div>
              </div>
              <Badge variant={group.is_active ? "default" : "secondary"}>
                {group.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedId(null)}
            className="h-11 gap-1"
          >
            <ChevronLeft className="size-4" />
            Back to list
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{selectedGroup.name}</h3>
              <Badge variant={selectedGroup.is_active ? "default" : "secondary"}>
                {selectedGroup.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {selectedGroup.description && (
              <p className="mt-1 text-sm text-muted-foreground">{selectedGroup.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-11"
              onClick={() => setEditingId(selectedGroup.id)}
            >
              <Settings className="size-4 mr-1" />
              Edit
            </Button>
            {selectedGroup.is_active && (
              <Button
                variant="ghost"
                size="sm"
                className="h-11"
                onClick={() => setDeactivatingId(selectedGroup.id)}
              >
                <X className="size-4 mr-1" />
                Deactivate
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeletingId(selectedGroup.id)}
            >
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="space-y-4">
            <OrganisationGroupMemberManager
              groupId={selectedGroup.id}
              disabled={!selectedGroup.is_active}
            />
          </TabsContent>
          <TabsContent value="capabilities" className="space-y-4">
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
