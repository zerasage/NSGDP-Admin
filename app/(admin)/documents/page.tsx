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
  Trash2,
  X,
} from "lucide-react";
import { useDocuments, useArchiveDocument } from "@/lib/hooks/useDocuments";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
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
import { Pagination } from "@/components/data/pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
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

const statusTabs = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

type StatusFilter = (typeof statusTabs)[number]["value"];

function statusBadgeVariant(status: DocumentStatus) {
  if (status === "published") return "default" as const;
  if (status === "archived") return "secondary" as const;
  return "outline" as const;
}

function fileSizeLabel(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

export default function AdminDocumentsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManage = user?.role === "super_admin" || hasPermission("manage:documents");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<DocumentType | "all">("all");
  const [formModalOpen, setFormModalOpen] = useState(false);

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

  const handleArchive = (doc: AdminDocument) => {
    if (!window.confirm(`Archive "${doc.title}"? It will be removed from the public catalogue.`)) return;
    archiveMutation.mutate(doc.slug, {
      onSuccess: () => toast.success("Document archived"),
      onError: (error) => {
        const err = error as { message?: string };
        toast.error(err?.message || "Failed to archive document");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            SOPs, policies, guidelines, reports, and research — the platform&apos;s document repository
          </p>
        </div>
        {canManage && (
          <Button className="h-11 w-full sm:h-8 sm:w-auto" onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Create document
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="scrollbar-hide overflow-x-auto border-b px-4">
          <div className="flex min-w-max gap-1" role="tablist" aria-label="Document status">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "relative min-h-11 px-3 text-sm font-medium transition-colors",
                  status === tab.value
                    ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title or description"
                className="h-11 pl-9 pr-10 sm:h-10"
                aria-label="Search documents"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-10"
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
              <SelectTrigger className="h-11 w-full sm:h-10 sm:w-56" aria-label="Filter by document type">
                <SelectValue>{(v: string) => (v === "all" ? "All types" : typeLabels[v as DocumentType] ?? v)}</SelectValue>
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
              {total === 1 ? "document" : "documents"}
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
            <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
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
                            <p className="line-clamp-1 font-semibold">{doc.title}</p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {doc.file_name ?? "No file uploaded"} · {fileSizeLabel(doc.file_size)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-40 px-4 py-3.5">
                        <Badge variant="secondary" className="max-w-full text-[11px]">
                          <span className="truncate">{typeLabels[doc.type]}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <Badge variant={statusBadgeVariant(doc.status)} className="text-[11px] capitalize">
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right font-medium tabular-nums">
                        {doc.download_count}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-xs text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
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
                              onClick={() => handleArchive(doc)}
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

            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {documents.map((doc) => (
                <article key={doc.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-5">{doc.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{typeLabels[doc.type]}</p>
                    </div>
                    <Badge variant={statusBadgeVariant(doc.status)} className="text-[11px] capitalize shrink-0">
                      {doc.status}
                    </Badge>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y py-3 min-w-0">
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">File</dt>
                      <dd className="mt-1 truncate text-sm font-medium">{doc.file_name ?? "None"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Downloads</dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums">{doc.download_count}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/documents/${doc.slug}`}
                      className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1")}
                    >
                      <Eye className="size-3.5 mr-1.5" />
                      View Details
                    </Link>
                    {canManage && (
                      <Button
                        variant="outline"
                        className="h-11 flex-1 text-destructive"
                        onClick={() => handleArchive(doc)}
                        disabled={doc.status === "archived"}
                      >
                        <Trash2 className="size-3.5 mr-1.5" />
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

      <DocumentFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
      />
    </div>
  );
}
