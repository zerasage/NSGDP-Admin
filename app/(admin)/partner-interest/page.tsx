"use client";

import { useEffect, useState } from "react";
import { 
  AlertCircle,
  Building2,
  CheckCircle2, 
  Handshake, 
  Loader2, 
  Lock, 
  Mail,
  Phone,
  RotateCcw,
  Search, 
  X, 
  XCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback/empty-state";
import { Pagination } from "@/components/data/pagination";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { 
  usePartnerInterests, 
  useReviewPartnerInterest 
} from "@/lib/hooks/usePartnerInterest";
import type { 
  PartnerInterest, 
  PartnerInterestStatus 
} from "@/lib/api/partner-interest";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import {
  DataTableShell,
  METRIC_TONE,
  Panel,
  tabToneClass,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";

const STATUS_CONFIG: Record<
  PartnerInterestStatus,
  { label: string; tone: MetricTone }
> = {
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  declined: { label: "Declined", tone: "destructive" },
};

const TABS: Array<{ key: PartnerInterestStatus | "all"; label: string; tone: MetricTone }> = [
  { key: "pending", label: "Pending", tone: "warning" },
  { key: "approved", label: "Approved", tone: "success" },
  { key: "declined", label: "Declined", tone: "destructive" },
  { key: "all", label: "All submissions", tone: "muted" },
];

function StatusBadge({ status }: { status: PartnerInterestStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  const t = METRIC_TONE[tone];
  return (
    <Badge variant="outline" className={cn("border text-xs capitalize", t.well, t.icon)}>
      {label}
    </Badge>
  );
}

type ReviewAction = "approve" | "decline";

export default function PartnerInterestPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, isLoading: permissionsLoading } = usePermissions();
  
  const isSuperAdmin = user?.role === "super_admin";
  const canReview = isSuperAdmin || hasPermission("review:partner-interest");
  const canView = isSuperAdmin || hasAnyPermission("view:partner-interest", "review:partner-interest");

  const [status, setStatus] = useState<PartnerInterestStatus | "all">("pending");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [reviewTarget, setReviewTarget] = useState<PartnerInterest | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction>("approve");
  const [reviewComment, setReviewComment] = useState("");
  const [commentTouched, setCommentTouched] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isFetching, isError, refetch } = usePartnerInterests(
    { 
      status: status === "all" ? undefined : status, 
      page, 
      limit: pageSize, 
      search: debouncedQuery || undefined 
    }
  );
  
  const reviewMutation = useReviewPartnerInterest();

  const interests = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const isSearchPending = query.trim() !== debouncedQuery;

  const openReviewDialog = (interest: PartnerInterest, action: ReviewAction) => {
    setReviewTarget(interest);
    setReviewAction(action);
    setReviewComment("");
    setCommentTouched(false);
  };

  const closeDialog = () => {
    setReviewTarget(null);
    setReviewComment("");
    setCommentTouched(false);
  };

  const declineCommentTooShort =
    reviewAction === "decline" && reviewComment.trim().length < 20;

  const handleReview = () => {
    if (!reviewTarget) return;
    if (declineCommentTooShort) {
      setCommentTouched(true);
      return;
    }

    reviewMutation.mutate(
      {
        id: reviewTarget.id,
        data: {
          status: reviewAction === "approve" ? "approved" : "declined",
          reviewComment: reviewComment.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ 
            title: reviewAction === "approve" 
              ? "Partner interest approved" 
              : "Partner interest declined" 
          });
          closeDialog();
        },
        onError: (error) => {
          toast({
            title: "Could not complete review",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Viewing partner interest submissions requires view:partner-interest or review:partner-interest permission. Ask a super_admin to grant your group one of these."
        />
      </div>
    );
  }

  const hasFilters = Boolean(debouncedQuery || status !== "pending");

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setStatus("pending");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Partner Interest</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review organisations interested in contributing data to the portal
          </p>
        </div>
        {!isLoading && (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
            {total} {total === 1 ? "submission" : "submissions"}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-muted-foreground">
        Organisations submit interest via the public portal. Review pending entries here — approval
        does not create an org automatically; follow up manually with an invite after vetting.
      </div>

      <Panel
        title="Submissions"
        description="Filter by status or search organisation, contact, and message text."
        icon={Handshake}
        tone="info"
      >
        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-1">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Submission status">
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search organisation, contact, or message"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 pl-9 pr-10"
                aria-label="Search partner interest submissions"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="h-10">
                <X className="size-4" />
                Clear filters
              </Button>
            )}

            <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
              {(isSearchPending || (isFetching && !isLoading)) && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              )}
              <span>
                {isSearchPending ? "Searching" : isFetching && !isLoading ? "Updating" : "Found"}{" "}
                <span className="font-semibold tabular-nums text-foreground">{total}</span>{" "}
                {total === 1 ? "submission" : "submissions"}
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
            <h2 className="mt-4 text-base font-semibold">Could not load submissions</h2>
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
                  {Array.from({ length: 6 }).map((_, index) => (
                    <TableRowSkeleton key={index} cols={6} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-48 rounded-xl" />
              ))}
            </div>
          </>
        ) : interests.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={Handshake}
              title={hasFilters ? "No matching submissions" : "No submissions yet"}
              description={
                hasFilters
                  ? "Try a different search term or status filter."
                  : "Partner interest submissions will appear here once organisations express interest."
              }
              action={
                hasFilters
                  ? { label: "Clear filters", onClick: clearFilters }
                  : undefined
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop table view */}
            <DataTableShell>
              <div className="hidden xl:block">
                <Table>
                <TableHeader>
                  <TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40">
                    <TableHead className="h-11 px-4">Organisation</TableHead>
                    <TableHead className="h-11 px-4">Contact</TableHead>
                    <TableHead className="h-11 px-4">Message</TableHead>
                    <TableHead className="h-11 px-4">Status</TableHead>
                    <TableHead className="h-11 px-4">Submitted</TableHead>
                    <TableHead className="h-11 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interests.map((interest) => (
                    <TableRow key={interest.id} className="hover:bg-muted/30">
                      <TableCell className="max-w-xs px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Building2 className="size-4" aria-hidden="true" />
                          </div>
                          <p className="line-clamp-2 font-semibold">{interest.organisation_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs px-4 py-3.5">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{interest.contact_name}</p>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3" />
                            {interest.contact_email}
                          </p>
                          {interest.contact_phone && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="size-3" />
                              {interest.contact_phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md px-4 py-3.5">
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {interest.message}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <StatusBadge status={interest.status} />
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-xs text-muted-foreground">
                        {formatDate(interest.created_at)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right">
                        {interest.status === "pending" && canReview ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                              onClick={() => openReviewDialog(interest, "approve")}
                            >
                              <CheckCircle2 className="size-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => openReviewDialog(interest, "decline")}
                            >
                              <XCircle className="size-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </DataTableShell>

            {/* Mobile card view */}
            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {interests.map((interest) => (
                <article key={interest.id} className="rounded-xl border bg-card p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="size-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-5">{interest.organisation_name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{interest.contact_name}</p>
                      </div>
                    </div>
                    <StatusBadge status={interest.status} />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-3.5 shrink-0" />
                      <span className="truncate">{interest.contact_email}</span>
                    </div>
                    {interest.contact_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-3.5 shrink-0" />
                        <span>{interest.contact_phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {interest.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span>Submitted {formatDate(interest.created_at)}</span>
                  </div>

                  {interest.status === "pending" && canReview && (
                    <div className="flex gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-950"
                        onClick={() => openReviewDialog(interest, "approve")}
                      >
                        <CheckCircle2 className="size-4 mr-1.5" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-11 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                        onClick={() => openReviewDialog(interest, "decline")}
                      >
                        <XCircle className="size-4 mr-1.5" />
                        Decline
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

      {/* Review Dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Decline"} Partner Interest
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "Approve this organisation's interest. You'll need to manually create the organisation record and send an invite."
                : "Decline this submission. The organisation will not be contacted automatically."}
            </DialogDescription>
          </DialogHeader>

          {reviewTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Organisation
                  </p>
                  <p className="mt-1 font-semibold">{reviewTarget.organisation_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Contact
                  </p>
                  <p className="mt-1 text-sm">{reviewTarget.contact_name}</p>
                  <p className="text-sm text-muted-foreground">{reviewTarget.contact_email}</p>
                  {reviewTarget.contact_phone && (
                    <p className="text-sm text-muted-foreground">{reviewTarget.contact_phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Message
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{reviewTarget.message}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-comment">
                  Comment {reviewAction === "decline" ? "(required)" : "(optional)"}
                </Label>
                <Textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  onBlur={() => setCommentTouched(true)}
                  placeholder={
                    reviewAction === "approve"
                      ? "Add notes about next steps (optional)..."
                      : "Explain why this submission is being declined..."
                  }
                  rows={4}
                  className="resize-none"
                />
                {commentTouched && declineCommentTooShort && (
                  <p className="text-xs text-destructive">
                    Comment must be at least 20 characters when declining
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={reviewMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              className={cn(
                reviewAction === "decline" && "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : reviewAction === "approve" ? (
                <>
                  <CheckCircle2 className="size-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="size-4 mr-2" />
                  Decline
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
