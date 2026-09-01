"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Eye,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { useDocuments, useArchiveDocument, useSubmitDocumentForReview } from "@/lib/hooks/useDocuments";
import { getDocuments } from "@/lib/api/documents";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/data/pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTableShell,
  METRIC_TONE,
  MetricCard,
  Panel,
  tabToneClass,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { DocumentFormModal } from "@/components/admin/document-form-modal";
import type { AdminDocument, DocumentType, DocumentStatus } from "@/lib/api/documents";
import { toast } from "sonner";

const typeLabels: Record<DocumentType, string> = {
  sop: "SOP",
  policy: "Policy",
  guideline: "Guideline",
  report: "Report",
  research: "Research",
  training: "Training",
  evaluation: "Evaluation",
  other: "Other",
};

const STATUS_CONFIG: Record<DocumentStatus, { label: string; tone: MetricTone }> = {
  draft: { label: "Draft", tone: "warning" },
  pending: { label: "Pending", tone: "warning" },
  under_review: { label: "Under review", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "warning" },
  published: { label: "Published", tone: "success" },
  archived: { label: "Archived", tone: "muted" },
};

const TABS: Array<{ key: DocumentStatus | "all"; label: string; tone: MetricTone }> = [
  { key: "all", label: "All documents", tone: "muted" },
  { key: "draft", label: "Draft", tone: "warning" },
  { key: "pending", label: "Pending review", tone: "warning" },
  { key: "under_review", label: "Under review", tone: "info" },
  { key: "approved", label: "Approved", tone: "success" },
  { key: "published", label: "Published", tone: "success" },
  { key: "rejected", label: "Rejected", tone: "warning" },
  { key: "archived", label: "Archived", tone: "muted" },
];

function fileSizeLabel(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

export default function AdminDocumentsPage() {
  const { can } = useAdminAccess();
  const canManage = can("manage:documents");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<DocumentStatus | "all">("all");
  const [type, setType] = useState<DocumentType | "all">("all");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<AdminDocument | null>(null);
  const submitMutation = useSubmitDocumentForReview();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isFetching, isError, refetch } = useDocuments({
    page,
    limit: pageSize,
    search: debouncedQuery || undefined,
    status: status === "all" ? undefined : status,
    type: type === "all" ? undefined : type,
  });
  const archiveMutation = useArchiveDocument();

  const [totalSummary, publishedSummary, draftSummary, archivedSummary] = useQueries({
    queries: [
      {
        queryKey: ["documents", "summary", "total"],
        queryFn: () => getDocuments({ page: 1, limit: 1 }),
        select: (result: Awaited<ReturnType<typeof getDocuments>>) => result.total,
      },
      {
        queryKey: ["documents", "summary", "published"],
        queryFn: () => getDocuments({ page: 1, limit: 1, status: "published" }),
        select: (result: Awaited<ReturnType<typeof getDocuments>>) => result.total,
      },
      {
        queryKey: ["documents", "summary", "draft"],
        queryFn: () => getDocuments({ page: 1, limit: 1, status: "draft" }),
        select: (result: Awaited<ReturnType<typeof getDocuments>>) => result.total,
      },
      {
        queryKey: ["documents", "summary", "archived"],
        queryFn: () => getDocuments({ page: 1, limit: 1, status: "archived" }),
        select: (result: Awaited<ReturnType<typeof getDocuments>>) => result.total,
      },
    ],
  });

  const statsLoading =
    totalSummary.isLoading ||
    publishedSummary.isLoading ||
    draftSummary.isLoading ||
    archivedSummary.isLoading;

  const documents = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const isSearchPending = query.trim() !== debouncedQuery;
  const hasFilters = !!query || !!debouncedQuery || status !== "all" || type !== "all";

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setStatus("all");
    setType("all");
    setPage(1);
  };

  const openCreate = () => {
    setFormModalOpen(true);
  };

  const confirmArchive = () => {
    if (!archiveTarget) return;
    archiveMutation.mutate(archiveTarget.slug, {
      onSuccess: () => {
        toast.success("Document archived");
        setArchiveTarget(null);
      },
      onError: (error) => {
        const err = error as { message?: string };
        toast.error(err?.message || "Failed to archive document");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            SOPs, policies, guidelines, reports, and research — the platform&apos;s document repository
          </p>
        </div>
        {!isLoading && (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
            {total} {total === 1 ? "document" : "documents"}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-muted-foreground">
        Documents are standalone files in the repository — SOPs, policies, guidelines, and reports.
        Publish when ready for the public catalogue; attach files from each document&apos;s detail page.
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
            label="Total documents"
            value={totalSummary.data ?? 0}
            hint="All statuses"
            icon={FileText}
            tone="primary"
          />
          <MetricCard
            label="Published"
            value={publishedSummary.data ?? 0}
            hint="On the public catalogue"
            icon={FileText}
            tone="success"
          />
          <MetricCard
            label="Drafts"
            value={draftSummary.data ?? 0}
            hint="Not yet published"
            icon={FileText}
            tone="warning"
          />
          <MetricCard
            label="Archived"
            value={archivedSummary.data ?? 0}
            hint="Removed from catalogue"
            icon={FileText}
            tone="muted"
          />
        </div>
      )}

      <Panel
        title="Document directory"
        description="Filter by status or type, or search by title or description."
        icon={FileText}
        tone="info"
        action={
          canManage ? (
            <Button className="h-9 w-full sm:w-auto" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Create document
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-1">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Document status">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={status === tab.key}
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                  className={cn(
                    "min-h-9 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                    status === tab.key
                      ? cn("shadow-sm", tabToneClass(tab.tone))
                      : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:max-w-sm">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title or description"
                  className="h-10 pl-9 pr-10"
                  aria-label="Search documents"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Clear document search"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value as DocumentType | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-full sm:w-56" aria-label="Filter by document type">
                  <SelectValue>
                    {(v: string) =>
                      v === "all" ? "All types" : (typeLabels[v as DocumentType] ?? v)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {(Object.keys(typeLabels) as DocumentType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {typeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                {total === 1 ? "document" : "documents"}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div aria-busy={isLoading || isFetching || isSearchPending} className="space-y-4">
        {isError ? (
          <div className="rounded-2xl border bg-card px-4 py-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold">Could not load documents</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Check your connection and try loading the document list again.
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
                    <TableRowSkeleton key={index} cols={6} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-40 rounded-xl" />
              ))}
            </div>
          </>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={FileText}
              title={hasFilters ? "No matching documents" : "No documents yet"}
              description={
                hasFilters
                  ? "Try a different search term, status, or document type."
                  : "SOPs, policies, and reports will appear here once created."
              }
              action={
                hasFilters
                  ? { label: "Clear filters", onClick: clearFilters }
                  : canManage
                    ? { label: "Create document", onClick: openCreate }
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
                      <TableHead className="h-11 px-4">Document</TableHead>
                      <TableHead className="h-11 px-4">Type</TableHead>
                      <TableHead className="h-11 px-4">Status</TableHead>
                      <TableHead className="h-11 px-4 text-right">Downloads</TableHead>
                      <TableHead className="h-11 px-4">Uploaded</TableHead>
                      <TableHead className="h-11 px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-muted/30">
                        <TableCell className="max-w-sm px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <FileText className="size-4" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/documents/${doc.slug}`}
                                className="line-clamp-1 font-semibold hover:underline"
                              >
                                {doc.title}
                              </Link>
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                {doc.file_name ?? "No file uploaded"} · {fileSizeLabel(doc.file_size)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-40 px-4 py-3.5">
                          <TypeBadge type={doc.type} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <DocumentStatusBadge status={doc.status} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right font-medium tabular-nums">
                          {doc.download_count}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-xs text-muted-foreground">
                          {formatDate(doc.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canManage &&
                              (doc.status === "draft" || doc.status === "rejected") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                disabled={!doc.file_path || submitMutation.isPending}
                                title={
                                  doc.file_path
                                    ? "Submit for review"
                                    : "Attach a file before submitting"
                                }
                                onClick={() =>
                                  submitMutation.mutate(doc.slug, {
                                    onSuccess: () =>
                                      toast.success(`“${doc.title}” submitted for review`),
                                    onError: (error) =>
                                      toast.error(
                                        error instanceof Error
                                          ? error.message
                                          : "Failed to submit for review"
                                      ),
                                  })
                                }
                              >
                                {submitMutation.isPending ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Send className="size-3.5" />
                                )}
                                Submit
                              </Button>
                            )}
                            {canManage &&
                              (doc.status === "pending" ||
                                doc.status === "under_review" ||
                                doc.status === "approved") && (
                              <Link
                                href={`/documents/${doc.slug}/review`}
                                className={cn(
                                  buttonVariants({ variant: "outline", size: "sm" }),
                                  "h-8"
                                )}
                              >
                                Review
                              </Link>
                            )}
                            <Link
                              href={`/documents/${doc.slug}`}
                              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                              aria-label={`View ${doc.title}`}
                              title="View details"
                            >
                              <Eye className="size-4" aria-hidden="true" />
                            </Link>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Archive ${doc.title}`}
                                title="Archive document"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setArchiveTarget(doc)}
                                disabled={doc.status === "archived"}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DataTableShell>

            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {documents.map((doc) => (
                <article key={doc.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/documents/${doc.slug}`}
                        className="line-clamp-2 text-sm font-semibold leading-5 hover:underline"
                      >
                        {doc.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">{typeLabels[doc.type]}</p>
                    </div>
                    <DocumentStatusBadge status={doc.status} />
                  </div>

                  <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 border-y py-3">
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        File
                      </dt>
                      <dd className="mt-1 truncate text-sm font-medium">{doc.file_name ?? "None"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Downloads
                      </dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums">{doc.download_count}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {canManage &&
                      (doc.status === "draft" || doc.status === "rejected") && (
                      <Button
                        className="h-11 flex-1"
                        disabled={!doc.file_path || submitMutation.isPending}
                        onClick={() =>
                          submitMutation.mutate(doc.slug, {
                            onSuccess: () =>
                              toast.success(`“${doc.title}” submitted for review`),
                            onError: (error) =>
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to submit for review"
                              ),
                          })
                        }
                      >
                        <Send className="mr-1.5 size-3.5" />
                        Submit for review
                      </Button>
                    )}
                    {canManage &&
                      (doc.status === "pending" ||
                        doc.status === "under_review" ||
                        doc.status === "approved") && (
                      <Link
                        href={`/documents/${doc.slug}/review`}
                        className={cn(buttonVariants({ variant: "default" }), "h-11 flex-1")}
                      >
                        Review
                      </Link>
                    )}
                    <Link
                      href={`/documents/${doc.slug}`}
                      className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1")}
                    >
                      <Eye className="mr-1.5 size-3.5" />
                      View details
                    </Link>
                    {canManage && (
                      <Button
                        variant="outline"
                        className="h-11 flex-1 text-destructive"
                        onClick={() => setArchiveTarget(doc)}
                        disabled={doc.status === "archived"}
                      >
                        <Trash2 className="mr-1.5 size-3.5" />
                        Archive
                      </Button>
                    )}
                  </div>
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

      <DocumentFormModal open={formModalOpen} onClose={() => setFormModalOpen(false)} />

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title="Archive document?"
        description={`"${archiveTarget?.title}" will be removed from the public catalogue but remains accessible to admins.`}
        confirmLabel="Archive"
        variant="destructive"
        loading={archiveMutation.isPending}
        onConfirm={confirmArchive}
      />
    </div>
  );
}

function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  const t = METRIC_TONE[tone];
  return (
    <Badge variant="outline" className={cn("border text-xs capitalize", t.well, t.icon)}>
      {label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: DocumentType }) {
  const t = METRIC_TONE.info;
  return (
    <Badge variant="outline" className={cn("max-w-full border text-[11px]", t.well, t.icon)}>
      <span className="truncate">{typeLabels[type]}</span>
    </Badge>
  );
}
