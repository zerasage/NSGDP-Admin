"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Loader2,
  Lock,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import {
  PERMANENT_DELETE_CONFIRM_PHRASE,
  bulkPermanentlyDeleteDatasets,
  listCleanupDatasets,
  permanentlyDeleteDataset,
  type CleanupDatasetRow,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/data/pagination";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { formatDate } from "@/lib/utils/date";
import type { DatasetStatus } from "@/lib/api/datasets";

function apiMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function DatasetCleanupPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [singleTarget, setSingleTarget] = useState<CleanupDatasetRow | null>(null);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, pageSize]);

  const listQuery = useQuery({
    queryKey: ["admin", "cleanup-datasets", page, pageSize, debouncedQuery],
    queryFn: () =>
      listCleanupDatasets({
        page,
        limit: pageSize,
        search: debouncedQuery || undefined,
      }),
    enabled: isSuperAdmin,
    placeholderData: keepPreviousData,
  });

  const rows = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const deletableOnPage = useMemo(
    () => rows.filter((row) => !row.gisSlot),
    [rows],
  );

  const allPageSelected =
    deletableOnPage.length > 0 &&
    deletableOnPage.every((row) => selectedSlugs.has(row.slug));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "cleanup-datasets"] });

  const singleDelete = useMutation({
    mutationFn: ({ slug, confirmSlug: typed }: { slug: string; confirmSlug: string }) =>
      permanentlyDeleteDataset(slug, typed),
    onSuccess: (result) => {
      toast.success(`Permanently deleted “${result.title}”`);
      setSingleTarget(null);
      setConfirmSlug("");
      setSelectedSlugs((prev) => {
        const next = new Set(prev);
        next.delete(result.slug);
        return next;
      });
      void invalidate();
    },
    onError: (error) => toast.error(apiMessage(error, "Failed to delete dataset")),
  });

  const bulkDelete = useMutation({
    mutationFn: (slugs: string[]) =>
      bulkPermanentlyDeleteDatasets(slugs, PERMANENT_DELETE_CONFIRM_PHRASE),
    onSuccess: (result) => {
      if (result.succeeded.length > 0) {
        toast.success(`Permanently deleted ${result.succeeded.length} dataset${result.succeeded.length === 1 ? "" : "s"}`);
      }
      for (const failure of result.failed) {
        toast.error(`${failure.slug}: ${failure.error}`);
      }
      setBulkOpen(false);
      setConfirmPhrase("");
      setSelectedSlugs(new Set());
      void invalidate();
    },
    onError: (error) => toast.error(apiMessage(error, "Bulk delete failed")),
  });

  const toggleSelect = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleSelectAllOnPage = (checked: boolean) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (checked) {
        for (const row of deletableOnPage) next.add(row.slug);
      } else {
        for (const row of deletableOnPage) next.delete(row.slug);
      }
      return next;
    });
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Super admin only"
          description="Permanent dataset deletion is restricted to super_admin accounts."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          Dataset cleanup
          <Badge variant="destructive">Temporary</Badge>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Prod wipe tool. Hard-deletes the catalogue row, warehouse observations it sourced, related ingestion records, and storage files. Soft-deleted datasets are included.
        </p>
      </div>

      <div
        role="alert"
        className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
      >
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold text-destructive">Irreversible</p>
          <p className="text-muted-foreground">
            This is not archive or retract. GIS-assigned datasets must be unassigned on GIS Reference first. Type the slug (or the phrase {PERMANENT_DELETE_CONFIRM_PHRASE} for bulk) to confirm.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or slug"
            className="pl-9"
            aria-label="Search datasets"
          />
        </div>
        {selectedSlugs.size > 0 ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setConfirmPhrase("");
              setBulkOpen(true);
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            Delete selected ({selectedSlugs.size})
          </Button>
        ) : null}
      </div>

      {listQuery.isError ? (
        <p className="text-sm text-destructive">
          {apiMessage(listQuery.error, "Failed to load datasets")}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40">
              <TableHead className="h-11 w-10 px-3">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={(checked) => toggleSelectAllOnPage(checked === true)}
                  aria-label="Select all deletable datasets on this page"
                  disabled={deletableOnPage.length === 0}
                />
              </TableHead>
              <TableHead className="h-11 px-4">Dataset</TableHead>
              <TableHead className="h-11 px-4">Development Partner</TableHead>
              <TableHead className="h-11 px-4">Status</TableHead>
              <TableHead className="h-11 px-4">Deleted</TableHead>
              <TableHead className="h-11 px-4">GIS</TableHead>
              <TableHead className="h-11 px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRowSkeleton key={index} cols={7} />
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No datasets match this search.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const blocked = Boolean(row.gisSlot);
                return (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell className="w-10 px-3 py-3.5">
                      <Checkbox
                        checked={selectedSlugs.has(row.slug)}
                        onCheckedChange={() => toggleSelect(row.slug)}
                        disabled={blocked}
                        aria-label={`Select ${row.title}`}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <p className="font-medium leading-5">{row.title}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{row.slug}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                      {row.organisationName ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <StatusBadge
                        status={row.status as DatasetStatus}
                        publishedAt={row.publishedAt}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-sm">
                      {row.deletedAt ? (
                        <Badge variant="secondary">{formatDate(row.deletedAt)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Live</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-sm">
                      {row.gisSlot ? (
                        <Badge variant="outline">{row.gisSlot}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={blocked}
                        title={
                          blocked
                            ? `Assigned to GIS slot ${row.gisSlot}. Unassign it first.`
                            : "Permanently delete"
                        }
                        onClick={() => {
                          setConfirmSlug("");
                          setSingleTarget(row);
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {meta ? (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          pageSize={pageSize}
          total={meta.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}

      <Dialog
        open={!!singleTarget}
        onOpenChange={(open) => {
          if (!open && !singleDelete.isPending) {
            setSingleTarget(null);
            setConfirmSlug("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Permanently delete dataset?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Type the slug{" "}
              <span className="font-mono text-foreground">{singleTarget?.slug}</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-slug">Dataset slug</Label>
            <Input
              id="confirm-slug"
              value={confirmSlug}
              onChange={(event) => setConfirmSlug(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={singleDelete.isPending}
              onClick={() => {
                setSingleTarget(null);
                setConfirmSlug("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                !singleTarget ||
                confirmSlug !== singleTarget.slug ||
                singleDelete.isPending
              }
              onClick={() =>
                singleTarget &&
                singleDelete.mutate({
                  slug: singleTarget.slug,
                  confirmSlug,
                })
              }
            >
              {singleDelete.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Permanently delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkOpen}
        onOpenChange={(open) => {
          if (!open && !bulkDelete.isPending) {
            setBulkOpen(false);
            setConfirmPhrase("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Permanently delete {selectedSlugs.size} datasets?</DialogTitle>
            <DialogDescription>
              Type {PERMANENT_DELETE_CONFIRM_PHRASE} to confirm. GIS-assigned rows cannot be selected. At most 25 datasets are deleted per request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-phrase">Confirmation phrase</Label>
            <Input
              id="confirm-phrase"
              value={confirmPhrase}
              onChange={(event) => setConfirmPhrase(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={bulkDelete.isPending}
              onClick={() => {
                setBulkOpen(false);
                setConfirmPhrase("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                confirmPhrase !== PERMANENT_DELETE_CONFIRM_PHRASE ||
                selectedSlugs.size === 0 ||
                bulkDelete.isPending
              }
              onClick={() => {
                const slugs = [...selectedSlugs].slice(0, 25);
                bulkDelete.mutate(slugs);
              }}
            >
              {bulkDelete.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Permanently delete selected"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
