"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  Eye,
  FileCheck,
  Globe,
  Lock,
  Database,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/data/status-badge";
import { VisibilityBadge } from "@/components/data/visibility-badge";
import { AgeBadge } from "@/components/data/age-badge";
import { Pagination } from "@/components/data/pagination";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { EmptyState } from "@/components/feedback/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTableShell,
  METRIC_TONE,
  MetricCard,
  Panel,
  tabToneClass,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { useToast } from "@/lib/hooks/use-toast";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { adminApi, archiveDataset, publishDataset, unarchiveDataset } from "@/lib/api/admin";
import type { DatasetStatus } from "@/lib/api/datasets";
import type { Visibility } from "@/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";

interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: DatasetStatus;
  format: string;
  visibility: Visibility;
  owner_id: string;
  organisation_id: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface Organisation {
  id: string;
  name: string;
  slug: string;
}

interface DatasetPage {
  data: Dataset[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const TABS: Array<{ key: DatasetStatus | "all"; label: string; tone: MetricTone }> = [
  { key: "all", label: "All datasets", tone: "muted" },
  { key: "pending", label: "Pending", tone: "warning" },
  { key: "under_review", label: "Under review", tone: "info" },
  { key: "approved", label: "Approved", tone: "success" },
  { key: "rejected", label: "Rejected", tone: "destructive" },
  { key: "archived", label: "Archived", tone: "muted" },
];

async function fetchQueueCount(path: string): Promise<number> {
  const response = await adminApi.get<{ data: DatasetPage }>(`${path}?page=1&limit=1`);
  return response.data.data.meta.total;
}

async function fetchStatusCount(status: DatasetStatus): Promise<number> {
  const response = await adminApi.get<{ data: DatasetPage }>(
    `/admin/datasets?page=1&limit=1&status=${status}`,
  );
  return response.data.data.meta.total;
}

export default function DatasetsReviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isLoading: permissionsLoading, can, canAny } = useAdminAccess();
  const canViewQueue = canAny("approve:datasets", "publish:datasets");
  const canApprove = can("approve:datasets");
  const canPublish = can("publish:datasets");
  const canArchive = can("archive:datasets");

  const [tab, setTab] = useState<DatasetStatus | "all">("pending");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [archiveTarget, setArchiveTarget] = useState<Dataset | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const archiveMutation = useMutation({
    mutationFn: (slug: string) => archiveDataset(slug),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset archived" });
      setArchiveTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "datasets"] });
    },
    onError: (error: unknown) =>
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive dataset",
        variant: "destructive",
      }),
  });

  const unarchiveMutation = useMutation({
    mutationFn: (slug: string) => unarchiveDataset(slug),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset restored from archive" });
      setArchiveTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "datasets"] });
    },
    onError: (error: unknown) =>
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore dataset",
        variant: "destructive",
      }),
  });

  const publishMutation = useMutation({
    mutationFn: (slug: string) => publishDataset(slug),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset published to the public catalogue" });
      queryClient.invalidateQueries({ queryKey: ["admin", "datasets"] });
    },
    onError: (error: unknown) =>
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish dataset",
        variant: "destructive",
      }),
  });

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin", "datasets", "queue", tab, debouncedQuery, page, pageSize],
    enabled: canViewQueue,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (debouncedQuery) params.append("search", debouncedQuery);

      if (tab === "pending") {
        const response = await adminApi.get<{ data: DatasetPage }>(`/admin/review-queue?${params}`);
        return response.data.data;
      }
      if (tab === "under_review") {
        const response = await adminApi.get<{ data: DatasetPage }>(
          `/admin/review-queue/under-review?${params}`,
        );
        return response.data.data;
      }
      if (tab !== "all") params.append("status", tab);
      const response = await adminApi.get<{ data: DatasetPage }>(`/admin/datasets?${params}`);
      return response.data.data;
    },
    placeholderData: keepPreviousData,
  });

  const [pendingSummary, underReviewSummary, approvedSummary, rejectedSummary] = useQueries({
    queries: [
      {
        queryKey: ["admin", "datasets", "summary", "pending"],
        queryFn: () => fetchQueueCount("/admin/review-queue"),
        enabled: canViewQueue,
      },
      {
        queryKey: ["admin", "datasets", "summary", "under_review"],
        queryFn: () => fetchQueueCount("/admin/review-queue/under-review"),
        enabled: canViewQueue,
      },
      {
        queryKey: ["admin", "datasets", "summary", "approved"],
        queryFn: () => fetchStatusCount("approved"),
        enabled: canViewQueue,
      },
      {
        queryKey: ["admin", "datasets", "summary", "rejected"],
        queryFn: () => fetchStatusCount("rejected"),
        enabled: canViewQueue,
      },
    ],
  });

  const statsLoading =
    pendingSummary.isLoading ||
    underReviewSummary.isLoading ||
    approvedSummary.isLoading ||
    rejectedSummary.isLoading;

  const { data: organisationsData } = useQuery({
    queryKey: ["admin", "organisations"],
    queryFn: async () => {
      const response = await adminApi.get<{ data: { data: Organisation[] } }>(
        "/admin/organisations?page=1&limit=100",
      );
      return response.data.data;
    },
  });

  const datasets = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const isSearchPending = query.trim() !== debouncedQuery;
  const hasFilters = !!query || !!debouncedQuery || tab !== "pending";

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setTab("pending");
    setPage(1);
  };

  const orgName = (organisationId: string | null) => {
    const org = organisationsData?.data?.find((o) => o.id === organisationId);
    return org?.name ?? "Unknown organisation";
  };

  const renderActions = (dataset: Dataset, mobile = false) => {
    const isReviewable = dataset.status === "pending" || dataset.status === "under_review";
    const reviewHref = isReviewable && canApprove
      ? `/datasets/${dataset.slug}/review`
      : `/datasets/${dataset.slug}`;

    return (
      <div className={cn("flex items-center gap-1.5", mobile && "w-full")}>
        <Link
          href={reviewHref}
          className={cn(
            buttonVariants({
              variant: isReviewable && canApprove ? "default" : "outline",
              size: "sm",
            }),
            "gap-1.5",
            mobile && "h-11 flex-1",
          )}
        >
          <Eye className="size-3.5" aria-hidden="true" />
          {isReviewable && canApprove ? "Review" : "View"}
        </Link>
        {dataset.status === "approved" && !dataset.published_at && canPublish && (
          <Button
            size="sm"
            variant="outline"
            className={cn("gap-1.5", mobile && "h-11 flex-1")}
            onClick={() => publishMutation.mutate(dataset.slug)}
            disabled={publishMutation.isPending}
            aria-label={`Publish ${dataset.title}`}
          >
            <Globe className="size-3.5" aria-hidden="true" />
            Publish
          </Button>
        )}
        {canArchive &&
          (dataset.status === "archived" ? (
            <Button
              size={mobile ? "default" : "icon-sm"}
              variant="ghost"
              className={mobile ? "size-11 shrink-0" : undefined}
              onClick={() => setArchiveTarget(dataset)}
              aria-label={`Restore ${dataset.title}`}
              title="Restore dataset"
            >
              <ArchiveRestore className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              size={mobile ? "default" : "icon-sm"}
              variant="ghost"
              className={mobile ? "size-11 shrink-0" : undefined}
              onClick={() => setArchiveTarget(dataset)}
              aria-label={`Archive ${dataset.title}`}
              title="Archive dataset"
            >
              <Archive className="size-4" aria-hidden="true" />
            </Button>
          ))}
      </div>
    );
  };

  if (!permissionsLoading && !canViewQueue) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Viewing the review queue requires approve:datasets or publish:datasets. Ask a super_admin to grant your group one of these."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage dataset submissions through the approval pipeline
          </p>
        </div>
        {!isLoading && (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
            {total} {total === 1 ? "dataset" : "datasets"}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-muted-foreground">
        New uploads enter as pending and move through review before approval. Approved datasets must
        still be published to appear on the public catalogue — approval and publishing are separate
        steps.
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
            label="Pending review"
            value={pendingSummary.data ?? 0}
            hint="Awaiting first review"
            icon={FileCheck}
            tone="warning"
          />
          <MetricCard
            label="Under review"
            value={underReviewSummary.data ?? 0}
            hint="Assigned to a reviewer"
            icon={Database}
            tone="info"
          />
          <MetricCard
            label="Approved"
            value={approvedSummary.data ?? 0}
            hint="Ready to publish"
            icon={Globe}
            tone="success"
          />
          <MetricCard
            label="Rejected"
            value={rejectedSummary.data ?? 0}
            hint="Returned to submitter"
            icon={Archive}
            tone="destructive"
          />
        </div>
      )}

      <Panel
        title="Dataset queue"
        description="Filter by workflow status or search title, format, and organisation."
        icon={FileCheck}
        tone="info"
      >
        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-1">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Dataset status">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => {
                    setTab(t.key);
                    setPage(1);
                  }}
                  className={cn(
                    "min-h-9 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                    tab === t.key
                      ? cn("shadow-sm", tabToneClass(t.tone))
                      : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search title, format or organisation"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 pl-9 pr-10"
                  aria-label="Search datasets"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
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
                {total === 1 ? "result" : "results"}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div aria-busy={isFetching || isSearchPending} className="space-y-4">
        {isError ? (
          <div className="rounded-2xl border bg-card px-4 py-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold">Could not load review queue</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Check your connection and try loading the dataset list again.
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
                  {[...Array(6)].map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-xl" />
              ))}
            </div>
          </>
        ) : datasets.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={Database}
              title={hasFilters ? "No matching datasets" : "Queue is empty"}
              description={
                hasFilters
                  ? "Try a different search term or status filter."
                  : "There are no datasets in this status."
              }
              action={hasFilters ? { label: "Clear filters", onClick: clearFilters } : undefined}
            />
          </div>
        ) : (
          <>
            <DataTableShell>
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40">
                      <TableHead className="h-11 px-4">Dataset</TableHead>
                      <TableHead className="h-11 px-4">Organisation</TableHead>
                      <TableHead className="h-11 px-4">Format</TableHead>
                      <TableHead className="h-11 px-4">Visibility</TableHead>
                      <TableHead className="h-11 px-4">Status</TableHead>
                      <TableHead className="h-11 px-4">Submitted</TableHead>
                      <TableHead className="h-11 px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasets.map((dataset) => (
                      <TableRow key={dataset.id} className="hover:bg-muted/30">
                        <TableCell className="max-w-sm px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Database className="size-4" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/datasets/${dataset.slug}`}
                                className="line-clamp-1 font-semibold hover:underline"
                              >
                                {dataset.title}
                              </Link>
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                {dataset.description || "No description provided"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-48 px-4 py-3.5 text-muted-foreground">
                          <span className="line-clamp-2">{orgName(dataset.organisation_id)}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <FormatBadge format={dataset.format} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <VisibilityBadge visibility={dataset.visibility} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <StatusBadge status={dataset.status} publishedAt={dataset.published_at} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          {dataset.status === "pending" || dataset.status === "under_review" ? (
                            <AgeBadge submittedAt={dataset.submitted_at || dataset.created_at} />
                          ) : (
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDate(dataset.submitted_at || dataset.created_at)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          {renderActions(dataset)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DataTableShell>

            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {datasets.map((dataset) => (
                <article key={dataset.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Database className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/datasets/${dataset.slug}`}
                        className="line-clamp-2 text-sm font-semibold leading-5 hover:underline"
                      >
                        {dataset.title}
                      </Link>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {orgName(dataset.organisation_id)}
                      </p>
                    </div>
                    <StatusBadge
                      status={dataset.status}
                      publishedAt={dataset.published_at}
                      className="shrink-0"
                    />
                  </div>

                  {dataset.description && (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {dataset.description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2 border-y py-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Format
                      </p>
                      <div className="mt-1">
                        <FormatBadge format={dataset.format} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Visibility
                      </p>
                      <div className="mt-1 truncate">
                        <VisibilityBadge visibility={dataset.visibility} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Submitted
                      </p>
                      <div className="mt-1 truncate">
                        {dataset.status === "pending" || dataset.status === "under_review" ? (
                          <AgeBadge submittedAt={dataset.submitted_at || dataset.created_at} />
                        ) : (
                          <p className="truncate text-xs font-medium">
                            {formatDate(dataset.submitted_at || dataset.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">{renderActions(dataset, true)}</div>
                </article>
              ))}
            </div>
          </>
        )}

        {!isLoading && datasets.length > 0 && (
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
        )}
      </div>

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={archiveTarget?.status === "archived" ? "Restore dataset?" : "Archive dataset?"}
        description={
          archiveTarget?.status === "archived"
            ? `"${archiveTarget?.title}" will be restored to its previous workflow status.`
            : `"${archiveTarget?.title}" will be removed from the public catalogue but remains accessible to admins.`
        }
        confirmLabel={archiveTarget?.status === "archived" ? "Restore" : "Archive"}
        variant={archiveTarget?.status === "archived" ? "default" : "destructive"}
        loading={archiveMutation.isPending || unarchiveMutation.isPending}
        onConfirm={() => {
          if (!archiveTarget) return;
          if (archiveTarget.status === "archived") {
            unarchiveMutation.mutate(archiveTarget.slug);
          } else {
            archiveMutation.mutate(archiveTarget.slug);
          }
        }}
      />
    </div>
  );
}

function FormatBadge({ format }: { format: string | null | undefined }) {
  const t = METRIC_TONE.info;
  return (
    <Badge variant="outline" className={cn("rounded-full border text-[11px] font-semibold", t.well, t.icon)}>
      {format?.toUpperCase() || "?"}
    </Badge>
  );
}
