"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Database,
  FileText,
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
import { useQueries } from "@tanstack/react-query";
import { useGroups, useDeleteGroup } from "@/lib/hooks/useGroups";
import { getGroups } from "@/lib/api/groups";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTableShell,
  METRIC_TONE,
  MetricCard,
  Panel,
} from "@/components/admin/admin-analytics-ui";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { GroupFormModal } from "@/components/admin/group-form-modal";
import { GroupMembersModal } from "@/components/admin/group-members-modal";
import type { AdminGroup } from "@/lib/api/groups";
import { toast } from "sonner";

export default function AdminGroupsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";
  const canManage = isSuperAdmin || hasPermission("manage:groups");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroup | undefined>(undefined);
  const [membersSlug, setMembersSlug] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<AdminGroup | null>(null);

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

  const [totalSummary, featuredSummary, aggregatesSummary] = useQueries({
    queries: [
      {
        queryKey: ["groups", "summary", "total"],
        queryFn: () => getGroups({ page: 1, limit: 1 }),
        select: (result: Awaited<ReturnType<typeof getGroups>>) => result.total,
        enabled: true,
      },
      {
        queryKey: ["groups", "summary", "featured"],
        queryFn: () => getGroups({ page: 1, limit: 1, featured: true }),
        select: (result: Awaited<ReturnType<typeof getGroups>>) => result.total,
        enabled: true,
      },
      {
        queryKey: ["groups", "summary", "aggregates"],
        queryFn: async () => {
          const result = await getGroups({ page: 1, limit: 100 });
          return {
            datasetLinks: result.data.reduce((sum, g) => sum + (g.dataset_ids?.length ?? 0), 0),
            documentLinks: result.data.reduce((sum, g) => sum + (g.document_ids?.length ?? 0), 0),
            complete: result.total <= 100,
          };
        },
        enabled: true,
      },
    ],
  });

  const statsLoading =
    totalSummary.isLoading || featuredSummary.isLoading || aggregatesSummary.isLoading;

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

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.slug, {
      onSuccess: () => {
        toast.success("Group deleted");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to delete group"),
    });
  };

  const aggregateHint = aggregatesSummary.data?.complete
    ? "Across all groups"
    : "From first 100 groups";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated topic collections of datasets and documents — e.g. &quot;Malaria Control
            2024–2026&quot;
          </p>
        </div>
        {!isLoading && (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
            {total} {total === 1 ? "group" : "groups"}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-muted-foreground">
        Groups bundle related datasets and documents for the public portal — thematic collections
        like disease programmes or policy areas. Feature a group to highlight it on the homepage
        catalogue.
      </div>

      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total groups"
            value={totalSummary.data ?? 0}
            hint="Curated collections"
            icon={FolderKanban}
            tone="primary"
          />
          <MetricCard
            label="Featured"
            value={featuredSummary.data ?? 0}
            hint="Highlighted on the portal"
            icon={Star}
            tone="warning"
          />
          <MetricCard
            label="Dataset links"
            value={aggregatesSummary.data?.datasetLinks ?? 0}
            hint={aggregateHint}
            icon={Database}
            tone="info"
          />
          <MetricCard
            label="Document links"
            value={aggregatesSummary.data?.documentLinks ?? 0}
            hint={aggregateHint}
            icon={FileText}
            tone="success"
          />
        </div>
      )}

      <Panel
        title="Group directory"
        description="Search by name or description."
        icon={FolderKanban}
        tone="info"
        action={
          canManage ? (
            <Button className="h-9 w-full sm:w-auto" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Create group
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:max-w-sm">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or description"
                className="h-10 pl-9 pr-10"
                aria-label="Search groups"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Clear group search"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {hasFilters && (
              <Button variant="ghost" className="h-10" onClick={clearFilters}>
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
      </Panel>

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
          <>
            <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
              <Table>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <TableRowSkeleton key={index} cols={5} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-3 xl:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-44 rounded-xl" />
              ))}
            </div>
          </>
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
            <DataTableShell>
              <div className="hidden xl:block">
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
                              <p className="line-clamp-1 flex flex-wrap items-center gap-1.5 font-semibold">
                                {group.name}
                                {group.is_featured && <FeaturedBadge />}
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
                                onClick={() => setDeleteTarget(group)}
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
            </DataTableShell>

            <div className="grid gap-3 xl:hidden">
              {groups.map((group) => (
                <article key={group.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FolderKanban className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 flex flex-wrap items-center gap-1.5 text-sm font-semibold leading-5">
                        {group.name}
                        {group.is_featured && <FeaturedBadge />}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y py-3">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Datasets
                      </dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums">
                        {group.dataset_ids?.length ?? 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Documents
                      </dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums">
                        {group.document_ids?.length ?? 0}
                      </dd>
                    </div>
                  </dl>

                  {canManage && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        className="h-11 flex-1"
                        onClick={() => setMembersSlug(group.slug)}
                      >
                        <Database className="mr-1.5 size-3.5" />
                        Manage
                      </Button>
                      <Button variant="outline" className="h-11 flex-1" onClick={() => openEdit(group)}>
                        <Pencil className="mr-1.5 size-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 text-destructive"
                        onClick={() => setDeleteTarget(group)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </article>
              ))}
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete group?"
        description={`"${deleteTarget?.name}" will be permanently removed. Dataset and document records are not deleted — only this collection link.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function FeaturedBadge() {
  const t = METRIC_TONE.warning;
  return (
    <Badge variant="outline" className={cn("border text-[10px]", t.well, t.icon)}>
      <Star className="mr-0.5 size-3 fill-current" aria-hidden />
      Featured
    </Badge>
  );
}
