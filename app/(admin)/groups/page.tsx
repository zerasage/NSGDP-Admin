"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Database,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useGroups, useDeleteGroup } from "@/lib/hooks/useGroups";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/data/pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { formatDate } from "@/lib/utils/date";
import { GroupFormModal } from "@/components/admin/group-form-modal";
import { GroupMembersModal } from "@/components/admin/group-members-modal";
import type { AdminGroup } from "@/lib/api/groups";
import { toast } from "sonner";

export default function AdminGroupsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManage = user?.role === "super_admin" || hasPermission("manage:groups");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroup | undefined>(undefined);
  const [membersSlug, setMembersSlug] = useState<string | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isFetching, isError, refetch } = useGroups({
    page,
    limit: pageSize,
    search: debouncedQuery || undefined,
  });
  const deleteMutation = useDeleteGroup();

  const groups = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const isSearchPending = query.trim() !== debouncedQuery;
  const hasFilters = !!query || !!debouncedQuery;

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setPage(1);
  };

  const openCreate = () => {
    setEditingGroup(undefined);
    setFormModalOpen(true);
  };

  const openEdit = (group: AdminGroup) => {
    setEditingGroup(group);
    setFormModalOpen(true);
  };

  const handleDelete = (group: AdminGroup) => {
    if (!window.confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(group.slug, {
      onSuccess: () => toast.success("Group deleted"),
      onError: () => toast.error("Failed to delete group"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated topic collections of datasets and documents — e.g. &quot;Malaria Control
            2024–2026&quot;
          </p>
        </div>
        {canManage && (
          <Button className="h-11 w-full sm:h-8 sm:w-auto" onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Create group
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or description"
                className="h-11 pl-9 pr-10 sm:h-10"
                aria-label="Search groups"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-10"
                  aria-label="Clear group search"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {hasFilters && (
              <Button variant="ghost" className="h-11 sm:h-10" onClick={clearFilters}>
                <X className="size-4" aria-hidden="true" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            {(isSearchPending || (isFetching && !isLoading)) && (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            )}
            <span>
              {isSearchPending ? "Searching" : isFetching && !isLoading ? "Updating" : "Found"}{" "}
              <span className="font-semibold tabular-nums text-foreground">{total}</span>{" "}
              {total === 1 ? "group" : "groups"}
            </span>
          </div>
        </div>
      </div>

      <div aria-busy={isLoading || isFetching || isSearchPending} className="space-y-4">
        {isError ? (
          <div className="rounded-2xl border bg-card px-4 py-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold">Could not load groups</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Check your connection and try loading the group list again.
            </p>
            <Button variant="outline" className="mt-5 h-11 sm:h-8" onClick={() => refetch()}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableBody>
                {Array.from({ length: 6 }).map((_, index) => (
                  <TableRowSkeleton key={index} cols={5} />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={FolderKanban}
              title={hasFilters ? "No matching groups" : "No groups yet"}
              description={
                hasFilters
                  ? "Try a different search term."
                  : "Curated topic collections will appear here once created."
              }
              action={
                hasFilters
                  ? { label: "Clear filters", onClick: clearFilters }
                  : canManage
                    ? { label: "Create group", onClick: openCreate }
                    : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40">
                    <TableHead className="h-11 px-4">Group</TableHead>
                    <TableHead className="h-11 px-4 text-right">Datasets</TableHead>
                    <TableHead className="h-11 px-4 text-right">Documents</TableHead>
                    <TableHead className="h-11 px-4">Created</TableHead>
                    <TableHead className="h-11 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id} className="hover:bg-muted/30">
                      <TableCell className="max-w-sm px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FolderKanban className="size-4" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 flex items-center gap-1.5 font-semibold">
                              {group.name}
                              {group.is_featured && (
                                <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                              )}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {group.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right font-medium tabular-nums">
                        {group.dataset_ids?.length ?? 0}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right font-medium tabular-nums">
                        {group.document_ids?.length ?? 0}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-xs text-muted-foreground">
                        {formatDate(group.created_at)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right">
                        {canManage && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Manage datasets in ${group.name}`}
                              title="Manage datasets"
                              onClick={() => setMembersSlug(group.slug)}
                            >
                              <Database className="size-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Edit ${group.name}`}
                              title="Edit group"
                              onClick={() => openEdit(group)}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${group.name}`}
                              title="Delete group"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(group)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Pagination
              page={page}
              totalPages={Math.max(1, totalPages)}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              className="rounded-xl border bg-card px-4 py-3"
            />
          </>
        )}
      </div>

      <GroupFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        group={editingGroup}
      />
      <GroupMembersModal
        open={!!membersSlug}
        onClose={() => setMembersSlug(undefined)}
        groupSlug={membersSlug}
      />
    </div>
  );
}
