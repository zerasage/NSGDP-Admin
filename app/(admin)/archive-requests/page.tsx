"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  Loader2,
  RotateCcw,
  Search,
  Undo2,
  X,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback/empty-state";
import { Pagination } from "@/components/data/pagination";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  useApproveArchiveRequest,
  useArchiveRequests,
  useDenyArchiveRequest,
} from "@/lib/hooks/useArchiveRequests";
import type { ArchiveRequestStatus } from "@/lib/api/archive-requests";
import {
  DataTableShell,
  METRIC_TONE,
  MetricCard,
  tabToneClass,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { HelpTip } from "@/components/admin/help-tip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";

const STATUS_CONFIG: Record<
  ArchiveRequestStatus,
  { label: string; tone: MetricTone }
> = {
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  denied: { label: "Denied", tone: "destructive" },
};

const TABS: Array<{ 
  key: ArchiveRequestStatus | "all"; 
  label: string; 
  tone: MetricTone;
  tip: string;
}> = [
  { 
    key: "pending", 
    label: "Pending", 
    tone: "warning",
    tip: "Requests waiting for admin review and decision"
  },
  { 
    key: "approved", 
    label: "Approved", 
    tone: "success",
    tip: "Archive requests that have been approved and datasets archived"
  },
  { 
    key: "denied", 
    label: "Denied", 
    tone: "destructive",
    tip: "Requests that were denied with explanation to requester"
  },
  { 
    key: "all", 
    label: "All requests", 
    tone: "muted",
    tip: "Complete history of all archive requests"
  },
];

export default function ArchiveRequestsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [tab, setTab] = useState<ArchiveRequestStatus | "all">("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<"approve" | "deny">("approve");
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isFetching, isError, refetch } = useArchiveRequests({
    status: tab === "all" ? undefined : tab,
    page,
    limit: pageSize,
    search: debouncedQuery || undefined,
    enabled: isSuperAdmin,
  });
  const approveMutation = useApproveArchiveRequest();
  const denyMutation = useDenyArchiveRequest();

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="Access restricted"
          description="Dataset retract requests are reviewed by platform super admins only."
        />
      </div>
    );
  }

  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const total = data?.meta.total ?? 0;
  const isSearchPending = query.trim() !== debouncedQuery;
  const detailsRequest = rows.find((r) => r.id === detailsId);
  const reviewing = rows.find((r) => r.id === reviewId);

  const submitReview = () => {
    if (!reviewId) return;
    const mutation = reviewMode === "approve" ? approveMutation : denyMutation;
    mutation.mutate(
      { id: reviewId, reviewComment: reviewComment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(
            reviewMode === "approve"
              ? "Dataset archived and requester notified"
              : "Retract request denied",
          );
          setReviewId(null);
          setReviewComment("");
        },
        onError: (error: Error) => toast.error(error.message || "Action failed"),
      },
    );
  };

  const pendingCount = rows.filter(r => r.status === "pending").length;
  const approvedCount = rows.filter(r => r.status === "approved").length;
  const deniedCount = rows.filter(r => r.status === "denied").length;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              Archive Requests
              <HelpTip content="Uploader requests to withdraw datasets that are under review or live. Approving archives the dataset on their behalf and notifies them to upload a replacement." label="About archive requests" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and process dataset retraction requests from uploaders
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            compact
            label="Total Requests"
            value={isLoading ? <Skeleton className="h-6 w-12" /> : total}
            hint="All statuses"
            tone="muted"
            icon={Undo2}
            tip={TABS.find(t => t.key === "all")?.tip}
          />
          <MetricCard
            compact
            label="Pending Review"
            value={isLoading ? <Skeleton className="h-6 w-12" /> : pendingCount}
            hint="Awaiting your decision"
            tone="warning"
            icon={AlertCircle}
            tip={TABS.find(t => t.key === "pending")?.tip}
          />
          <MetricCard
            compact
            label="Approved"
            value={isLoading ? <Skeleton className="h-6 w-12" /> : approvedCount}
            hint="Dataset archived"
            tone="success"
            icon={CheckCircle2}
            tip={TABS.find(t => t.key === "approved")?.tip}
          />
          <MetricCard
            compact
            label="Denied"
            value={isLoading ? <Skeleton className="h-6 w-12" /> : deniedCount}
            hint="Request denied"
            tone="destructive"
            icon={XCircle}
            tip={TABS.find(t => t.key === "denied")?.tip}
          />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="rounded-xl border bg-muted/30 p-1">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Archive request status">
              {TABS.map((item) => (
                <div key={item.key} className="inline-flex items-center gap-0.5">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === item.key}
                    onClick={() => {
                      setTab(item.key);
                      setPage(1);
                    }}
                    className={cn(
                      "min-h-9 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                      tab === item.key
                        ? cn("shadow-sm", tabToneClass(item.tone))
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                  {tab === item.key ? (
                    <HelpTip content={item.tip} label={`About ${item.label}`} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search requester, email, or dataset title"
                className="h-10 pl-9 pr-10"
                aria-label="Search archive requests"
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

        {/* Table */}
        <div aria-busy={isLoading || isFetching} className="space-y-4">
          {isError ? (
            <div className="rounded-2xl border bg-card px-4 py-12 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-7" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-base font-semibold">Could not load archive requests</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Check your connection and try loading the list again.
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
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} cols={6} />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 xl:hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-xl" />
                ))}
              </div>
            </>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border bg-card">
              <EmptyState
                icon={Undo2}
                title={tab === "pending" ? "No pending requests" : "No requests found"}
                description={
                  tab === "pending"
                    ? "There are no archive requests awaiting review at the moment."
                    : "No archive requests match the current filter."
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
                    <TableHead className="h-11 px-4">Dataset</TableHead>
                    <TableHead className="h-11 px-4">Requester</TableHead>
                    <TableHead className="h-11 px-4">Reason</TableHead>
                    <TableHead className="h-11 px-4">Status</TableHead>
                    <TableHead className="h-11 px-4">Requested</TableHead>
                    <TableHead className="h-11 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const status = STATUS_CONFIG[row.status];
                    const requesterName = row.requester
                      ? [row.requester.first_name, row.requester.last_name]
                          .filter(Boolean)
                          .join(" ") || row.requester.email
                      : "Unknown";
                    return (
                      <TableRow key={row.id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3.5">
                          <div className="space-y-1">
                            {row.dataset ? (
                              <Link
                                href={`/datasets/${row.dataset.slug}`}
                                className="font-medium hover:underline"
                              >
                                {row.dataset.title}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">Dataset removed</span>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {row.dataset?.status?.replace("_", " ")}
                              {row.dataset?.published_at ? " · published" : ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="text-sm">{requesterName}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.requester?.email}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate text-sm" title={row.reason}>
                              {row.reason}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 shrink-0 gap-1 px-2 text-xs"
                              onClick={() => setDetailsId(row.id)}
                            >
                              <Eye className="size-3.5" aria-hidden="true" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn("border text-xs", METRIC_TONE[status.tone].well, METRIC_TONE[status.tone].icon)}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                          {formatDate(row.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          {row.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => {
                                  setReviewMode("deny");
                                  setReviewId(row.id);
                                  setReviewComment("");
                                }}
                              >
                                <XCircle className="size-3.5" aria-hidden="true" />
                                Deny
                              </Button>
                              <Button
                                size="sm"
                                className="gap-1.5"
                                onClick={() => {
                                  setReviewMode("approve");
                                  setReviewId(row.id);
                                  setReviewComment("");
                                }}
                              >
                                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                Archive
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </DataTableShell>

            <div className="grid gap-3 xl:hidden">
              {rows.map((row) => {
                const status = STATUS_CONFIG[row.status];
                const requesterName = row.requester
                  ? [row.requester.first_name, row.requester.last_name]
                      .filter(Boolean)
                      .join(" ") || row.requester.email
                  : "Unknown";
                return (
                  <article key={row.id} className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {row.dataset ? (
                          <Link
                            href={`/datasets/${row.dataset.slug}`}
                            className="line-clamp-2 text-sm font-semibold leading-5 hover:underline"
                          >
                            {row.dataset.title}
                          </Link>
                        ) : (
                          <p className="line-clamp-2 text-sm font-semibold leading-5 text-muted-foreground">
                            Dataset removed
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">{requesterName}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 border text-xs", METRIC_TONE[status.tone].well, METRIC_TONE[status.tone].icon)}
                      >
                        {status.label}
                      </Badge>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="line-clamp-3 text-sm text-muted-foreground">{row.reason}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-y py-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Requester
                        </p>
                        <p className="mt-1 truncate text-xs font-medium">{row.requester?.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Requested
                        </p>
                        <p className="mt-1 text-xs font-medium">{formatDate(row.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 px-2 text-xs"
                        onClick={() => setDetailsId(row.id)}
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                        View reason
                      </Button>
                    </div>

                    {row.status === "pending" ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-11 flex-1"
                          onClick={() => {
                            setReviewMode("deny");
                            setReviewId(row.id);
                            setReviewComment("");
                          }}
                        >
                          <XCircle className="size-3.5" aria-hidden="true" />
                          Deny
                        </Button>
                        <Button
                          size="sm"
                          className="h-11 flex-1"
                          onClick={() => {
                            setReviewMode("approve");
                            setReviewId(row.id);
                            setReviewComment("");
                          }}
                        >
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          Archive
                        </Button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
            </>
          )}

          {!isLoading && rows.length > 0 && (
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

        {/* Request Details Dialog */}
        <Dialog open={!!detailsId} onOpenChange={(open) => !open && setDetailsId(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Retract request details</DialogTitle>
              <DialogDescription>
                Review the request context and the contributor&apos;s full reason.
              </DialogDescription>
            </DialogHeader>
            {detailsRequest ? (
              <div className="space-y-5">
                <div className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Dataset
                    </p>
                    {detailsRequest.dataset ? (
                      <Link
                        href={`/datasets/${detailsRequest.dataset.slug}`}
                        className="mt-1 block font-medium hover:underline"
                      >
                        {detailsRequest.dataset.title}
                      </Link>
                    ) : (
                      <p className="mt-1 text-muted-foreground">Dataset removed</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-1 border text-xs",
                        METRIC_TONE[STATUS_CONFIG[detailsRequest.status].tone].well,
                        METRIC_TONE[STATUS_CONFIG[detailsRequest.status].tone].icon,
                      )}
                    >
                      {STATUS_CONFIG[detailsRequest.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Requested by
                    </p>
                    <p className="mt-1 font-medium">
                      {detailsRequest.requester
                        ? [detailsRequest.requester.first_name, detailsRequest.requester.last_name]
                            .filter(Boolean)
                            .join(" ") || detailsRequest.requester.email
                        : "Unknown"}
                    </p>
                    {detailsRequest.requester?.email ? (
                      <p className="text-xs text-muted-foreground">{detailsRequest.requester.email}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Requested on
                    </p>
                    <p className="mt-1 font-medium">{formatDate(detailsRequest.created_at)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Reason
                  </p>
                  <div className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 text-sm leading-6">
                    {detailsRequest.reason}
                  </div>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDetailsId(null)}>
                Close
              </Button>
              {detailsRequest?.status === "pending" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      setDetailsId(null);
                      setReviewMode("deny");
                      setReviewId(detailsRequest.id);
                      setReviewComment("");
                    }}
                  >
                    <XCircle className="size-3.5" aria-hidden="true" />
                    Deny
                  </Button>
                  <Button
                    type="button"
                    className="gap-1.5"
                    onClick={() => {
                      setDetailsId(null);
                      setReviewMode("approve");
                      setReviewId(detailsRequest.id);
                      setReviewComment("");
                    }}
                  >
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    Archive
                  </Button>
                </>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog
          open={!!reviewId}
          onOpenChange={(open) => {
            if (!open) {
              setReviewId(null);
              setReviewComment("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {reviewMode === "approve" ? "Archive dataset" : "Deny retract request"}
              </DialogTitle>
              <DialogDescription>
                {reviewMode === "approve"
                  ? `Archive "${reviewing?.dataset?.title ?? "this dataset"}" on behalf of the requester. They will be notified to upload a new dataset.`
                  : `Deny the retract request for "${reviewing?.dataset?.title ?? "this dataset"}". Include a reason to help the requester understand the decision.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="review-comment">
                {reviewMode === "deny" ? "Reason for denial" : "Note"} 
                {reviewMode === "deny" ? " (required)" : " (optional)"}
              </Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  reviewMode === "deny"
                    ? "Explain why the archive request cannot be approved..."
                    : "Optional note for the requester..."
                }
                rows={3}
                maxLength={2000}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewId(null)}
                disabled={approveMutation.isPending || denyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={reviewMode === "approve" ? "default" : "destructive"}
                onClick={submitReview}
                disabled={
                  (approveMutation.isPending || denyMutation.isPending) ||
                  (reviewMode === "deny" && !reviewComment.trim())
                }
              >
                {(approveMutation.isPending || denyMutation.isPending) && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {reviewMode === "approve" ? "Archive dataset" : "Deny request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
