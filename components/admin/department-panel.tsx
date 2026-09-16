"use client";

import { useState } from "react";
import { Building2, ChevronLeft, Settings, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { DepartmentForm } from "./department-form";
import { DepartmentMemberManager } from "./department-member-manager";
import {
  useDepartments,
  useMyDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeactivateDepartment,
  useDeleteDepartment,
} from "@/lib/hooks/useDepartments";
import {
  METRIC_TONE,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { useToast } from "@/lib/hooks/use-toast";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

interface DepartmentPanelProps {
  isSuperAdmin: boolean;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

function DepartmentStatusBadge({ active }: { active: boolean }) {
  const tone: MetricTone = active ? "success" : "muted";
  const t = METRIC_TONE[tone];
  return (
    <Badge variant="outline" className={cn("border text-xs", t.well, t.icon)}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

export function DepartmentPanel({ isSuperAdmin, createOpen, onCreateOpenChange }: DepartmentPanelProps) {
  // Super admin sees every department; a manage:department-members-only
  // holder only sees department(s) they belong to.
  const allDepartments = useDepartments();
  const myDepartments = useMyDepartments();
  const { data: departments, isLoading } = isSuperAdmin ? allDepartments : myDepartments;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const create = useCreateDepartment();
  const update = useUpdateDepartment();
  const deactivate = useDeactivateDepartment();
  const deleteDepartment = useDeleteDepartment();
  const { toast } = useToast();

  const handleCreate = (payload: { name: string; description?: string }) => {
    create.mutate(payload, {
      onSuccess: (created) => {
        toast({ title: `Created department "${created.name}"` });
        onCreateOpenChange(false);
        setSelectedId(created.id);
      },
      onError: (error: unknown) =>
        toast({
          title: "Couldn't create department",
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
          toast({ title: `Updated department "${updated.name}"` });
          setEditingId(null);
        },
        onError: (error: unknown) =>
          toast({
            title: "Couldn't update department",
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
        toast({ title: `Deactivated department "${updated.name}"` });
        setDeactivatingId(null);
      },
      onError: (error: unknown) => {
        toast({
          title: "Couldn't deactivate department",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
        setDeactivatingId(null);
      },
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    const department = departments?.find((d) => d.id === deletingId);
    deleteDepartment.mutate(deletingId, {
      onSuccess: () => {
        toast({ title: `Deleted department "${department?.name ?? "Unknown"}"` });
        setDeletingId(null);
        if (selectedId === deletingId) setSelectedId(null);
      },
      onError: (error: unknown) => {
        toast({
          title: "Couldn't delete department",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
        setDeletingId(null);
      },
    });
  };

  const selectedDepartment = departments?.find((d) => d.id === selectedId);
  const editingDepartment = departments?.find((d) => d.id === editingId);
  const deactivatingDepartment = departments?.find((d) => d.id === deactivatingId);
  const deletingDepartment = departments?.find((d) => d.id === deletingId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!departments || departments.length === 0) {
    return (
      <div>
        {createOpen && isSuperAdmin ? (
          <DepartmentForm
            onSave={handleCreate}
            onCancel={() => onCreateOpenChange(false)}
            isSaving={create.isPending}
          />
        ) : (
          <EmptyState
            icon={Building2}
            title={isSuperAdmin ? "No departments yet" : "You don't belong to any department"}
            description={
              isSuperAdmin
                ? "Create departments and assign staff to them."
                : "Ask a super_admin to add you to a department."
            }
            action={isSuperAdmin ? { label: "New department", onClick: () => onCreateOpenChange(true) } : undefined}
          />
        )}
      </div>
    );
  }

  if (createOpen && isSuperAdmin) {
    return (
      <DepartmentForm
        onSave={handleCreate}
        onCancel={() => onCreateOpenChange(false)}
        isSaving={create.isPending}
      />
    );
  }

  if (editingId && editingDepartment && isSuperAdmin) {
    return (
      <DepartmentForm
        initial={editingDepartment}
        onSave={(payload) => handleUpdate(editingId, payload)}
        onCancel={() => setEditingId(null)}
        isSaving={update.isPending}
      />
    );
  }

  if (!selectedId || !selectedDepartment) {
    return (
      <div className="space-y-3">
        {departments.map((department) => {
          const tone: MetricTone = department.is_active ? "success" : "muted";
          const t = METRIC_TONE[tone];
          return (
            <button
              key={department.id}
              type="button"
              onClick={() => setSelectedId(department.id)}
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
                    <p className="font-semibold">{department.name}</p>
                    {department.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {department.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" aria-hidden />
                        {department.member_count} {department.member_count === 1 ? "member" : "members"}
                      </span>
                      <span aria-hidden>•</span>
                      <span>Created {formatDate(department.created_at)}</span>
                    </div>
                  </div>
                </div>
                <DepartmentStatusBadge active={department.is_active} />
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
                <h3 className="text-lg font-bold">{selectedDepartment.name}</h3>
                <DepartmentStatusBadge active={selectedDepartment.is_active} />
              </div>
              {selectedDepartment.description && (
                <p className="mt-1 text-sm text-muted-foreground">{selectedDepartment.description}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedDepartment.member_count} members · Created {formatDate(selectedDepartment.created_at)}
              </p>
            </div>
            {isSuperAdmin && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setEditingId(selectedDepartment.id)}
                >
                  <Settings className="size-4" />
                  Edit
                </Button>
                {selectedDepartment.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => setDeactivatingId(selectedDepartment.id)}
                  >
                    <X className="size-4" />
                    Deactivate
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeletingId(selectedDepartment.id)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">Members</p>
          <DepartmentMemberManager
            departmentId={selectedDepartment.id}
            disabled={!selectedDepartment.is_active}
          />
        </div>
      </div>

      {isSuperAdmin && (
        <>
          <ConfirmDialog
            open={!!deactivatingId}
            onOpenChange={(open) => !open && setDeactivatingId(null)}
            title="Deactivate department?"
            description={`Deactivating "${deactivatingDepartment?.name}" prevents membership changes. Members are preserved and the department can be reactivated later.`}
            confirmLabel="Deactivate"
            loading={deactivate.isPending}
            onConfirm={handleDeactivate}
          />

          <ConfirmDialog
            open={!!deletingId}
            onOpenChange={(open) => !open && setDeletingId(null)}
            title="Delete department permanently?"
            description={`Deleting "${deletingDepartment?.name}" cannot be undone. Remove all members first.`}
            confirmLabel="Delete"
            loading={deleteDepartment.isPending}
            onConfirm={handleDelete}
          />
        </>
      )}
    </>
  );
}
