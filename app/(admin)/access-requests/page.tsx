"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  RotateCcw,
  Search,
  UserRound,
  X,
  XCircle,
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
  DialogTitle,
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
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import {
  useAccessRequests,
  useApproveAccessRequest,
  useDenyAccessRequest,
} from "@/lib/hooks/useAccessRequests";
import type { AccessRequest, AccessRequestStatus } from "@/lib/api/access-requests";
import {
  DataTableShell,
  METRIC_TONE,
  Panel,
  tabToneClass,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";

const STATUS_CONFIG: Record<AccessRequestStatus, { label: string; tone: MetricTone }> = {
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  denied: { label: "Denied", tone: "destructive" },
};

const TABS: Array<{ key: AccessRequestStatus | "all"; label: string; tone: MetricTone }> = [
  { key: "pending", label: "Pending", tone: "warning" },
  { key: "approved", label: "Approved", tone: "success" },
  { key: "denied", label: "Denied", tone: "destructive" },
  { key: "all", label: "All requests", tone: "muted" },
];

function StatusBadge({ status }: { status: AccessRequestStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  const t = METRIC_TONE[tone];
  return (
    <Badge variant="outline" className={cn("border text-xs capitalize", t.well, t.icon)}>
      {label}
    </Badge>
  );
}

export default function AccessRequestsPage() {
  const { toast } = useToast();
  const { isLoading: permissionsLoading, can, canAny } = useAdminAccess();
  const canAdjudicate = can("approve:access-requests");
  const canView = canAny("view:access-requests", "approve:access-requests");
  const [status, setStatus] = useState<AccessRequestStatus | "all">("pending");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [denyTarget, setDenyTarget] = useState<AccessRequest | null>(null);
  const [comment, setComment] = useState("");
  const [commentTouched, setCommentTouched] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const request = useAccessRequests(
    {
      status: status === "all" ? undefined : status,
      page,
      limit: pageSize,
      search: debouncedQuery || undefined,
    },
    canView,
  );
  const approveMutation = useApproveAccessRequest();
  const denyMutation = useDenyAccessRequest();
  const requests = request.data?.data ?? [];
  const meta = request.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  const isSearchPending = query.trim() !== debouncedQuery;

  const approve = (id: string) =>
    approveMutation.mutate(id, {
      onSuccess: () => toast({ title: "Access request approved" }),
      onError: (error) =>
        toast({
          title: "Could not approve request",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        }),
    });

  const closeDialog = () => {
    setDenyTarget(null);
    setComment("");
    setCommentTouched(false);
  };

  const deny = () => {
    setCommentTouched(true);
    if (!denyTarget || comment.trim().length < 20) return;
    denyMutation.mutate(
      { id: denyTarget.id, comment: comment.trim() },
      {
        onSuccess: () => {
          toast({ title: "Access request denied" });
          closeDialog();
        },
        onError: (error) =>
          toast({
            title: "Could not deny request",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Viewing access requests requires view:access-requests or approve:access-requests. Ask a super_admin to grant your group one of these."
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
          <h1 className="text-2xl font-bold tracking-tight">Access Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review user requests for restricted dataset access
          </p>
        </div>
        {!request.isLoading && (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
            {total} {total === 1 ? "request" : "requests"}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-muted-foreground">
        Users request access to restricted datasets from the public portal. Approving grants download
        rights for that dataset; denying requires a reason shown to the requester.
      </div>

      <Panel
        title="Requests"
        description="Filter by status or search requester name, email, or dataset title."
        icon={KeyRound}
        tone="info"
      >
        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-1">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Request status">
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
                placeholder="Search requester, email, or dataset"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 pl-9 pr-10"
                aria-label="Search access requests"
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
              {(isSearchPending || (request.isFetching && !request.isLoading)) && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              )}
              <span>
                {isSearchPending ? "Searching" : request.isFetching && !request.isLoading ? "Updating" : "Found"}{" "}
                <span className="font-semibold tabular-nums text-foreground">{total}</span>{" "}
                {total === 1 ? "result" : "results"}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div aria-busy={request.isFetching || isSearchPending} className="space-y-4">
        {request.isLoading ? (
          <>
            <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
              <Table>
                <TableBody>
                  {[...Array(6)].map((_, i) => (
                    <TableRowSkeleton key={i} cols={6} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-3 xl:hidden">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-xl" />
              ))}
            </div>
          </>
        ) : request.isError ? (
          <div className="rounded-2xl border bg-card px-4 py-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold">Could not load access requests</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Check your connection and try loading the list again.
            </p>
            <Button variant="outline" className="mt-5 h-11 sm:h-8" onClick={() => request.refetch()}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={KeyRound}
              title={hasFilters ? "No matching requests" : "No access requests yet"}
              description={
                hasFilters
                  ? "Try another search or status filter."
                  : "New requests will appear here when users request restricted dataset access."
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
                      <TableHead className="h-11 px-4">Requester</TableHead>
                      <TableHead className="h-11 px-4">Dataset</TableHead>
                      <TableHead className="h-11 px-4">Reason</TableHead>
                      <TableHead className="h-11 px-4">Status</TableHead>
                      <TableHead className="h-11 px-4">Requested</TableHead>
                      <TableHead className="h-11 px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="max-w-56 px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <UserRound className="size-4" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-1 font-semibold">
                                {r.requester_name || "Unnamed requester"}
                              </p>
                              <a
                                href={`mailto:${r.requester_email}`}
                                className="mt-0.5 line-clamp-1 text-xs text-muted-foreground hover:underline"
                              >
                                {r.requester_email}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-56 px-4 py-3.5">
                          {r.dataset_slug ? (
                            <Link
                              href={`/datasets/${r.dataset_slug}`}
                              className="line-clamp-2 font-medium hover:underline"
                            >
                              {r.dataset_title}
                            </Link>
                          ) : (
                            <span className="line-clamp-2 font-medium">{r.dataset_title}</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-sm px-4 py-3.5">
                          <span className="line-clamp-2 text-sm text-muted-foreground" title={r.reason}>
                            {r.reason}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                          {formatDate(r.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          <Actions
                            request={r}
                            canAdjudicate={canAdjudicate}
                            busy={approveMutation.isPending || denyMutation.isPending}
                            approve={approve}
                            deny={setDenyTarget}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DataTableShell>

            <div className="grid gap-3 xl:hidden">
              {requests.map((r) => (
                <article key={r.id} className="space-y-4 rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <UserRound className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold leading-5">
                        {r.requester_name || "Unnamed requester"}
                      </p>
                      <a
                        href={`mailto:${r.requester_email}`}
                        className="mt-1 truncate text-xs text-muted-foreground hover:underline"
                      >
                        {r.requester_email}
                      </a>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="line-clamp-3 text-sm text-muted-foreground">{r.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y py-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Dataset
                      </p>
                      {r.dataset_slug ? (
                        <Link
                          href={`/datasets/${r.dataset_slug}`}
                          className="mt-1 line-clamp-2 text-xs font-medium hover:underline"
                        >
                          {r.dataset_title}
                        </Link>
                      ) : (
                        <p className="mt-1 line-clamp-2 text-xs font-medium">{r.dataset_title}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Requested
                      </p>
                      <p className="mt-1 text-xs font-medium">{formatDate(r.created_at)}</p>
                    </div>
                  </div>

                  {r.review_comment && (
                    <p className="text-xs text-muted-foreground">Review note: {r.review_comment}</p>
                  )}

                  <Actions
                    request={r}
                    canAdjudicate={canAdjudicate}
                    busy={approveMutation.isPending || denyMutation.isPending}
                    approve={approve}
                    deny={setDenyTarget}
                    mobile
                  />
                </article>
              ))}
            </div>
          </>
        )}

        {!request.isLoading && requests.length > 0 && (
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

      <Dialog open={Boolean(denyTarget)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deny access request</DialogTitle>
            <DialogDescription>
              Tell the requester why access to {denyTarget?.dataset_title} cannot be granted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="deny-comment">
              Denial reason <span className="font-normal text-destructive">Required</span>
            </Label>
            <Textarea
              id="deny-comment"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setCommentTouched(true);
              }}
              onBlur={() => setCommentTouched(true)}
              rows={5}
              aria-describedby="deny-help deny-error"
              aria-invalid={commentTouched && comment.trim().length < 20}
              placeholder="Give a specific reason the requester can act on…"
              className={cn(commentTouched && comment.trim().length < 20 && "border-destructive")}
            />
            <p id="deny-help" className="text-xs text-muted-foreground">
              Minimum 20 characters · {comment.trim().length}/20
            </p>
            {commentTouched && comment.trim().length < 20 && (
              <p id="deny-error" className="text-sm text-destructive">
                Enter at least 20 characters.
              </p>
            )}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" className="h-11 w-full sm:h-9 sm:w-auto" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-11 w-full sm:h-9 sm:w-auto"
              onClick={deny}
              disabled={denyMutation.isPending}
            >
              {denyMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Denying…
                </>
              ) : (
                "Deny request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Actions({
  request,
  canAdjudicate,
  busy,
  approve,
  deny,
  mobile = false,
}: {
  request: AccessRequest;
  canAdjudicate: boolean;
  busy: boolean;
  approve: (id: string) => void;
  deny: (request: AccessRequest) => void;
  mobile?: boolean;
}) {
  if (request.status !== "pending") {
    return (
      <span className="text-xs text-muted-foreground">{request.review_comment || "Review complete"}</span>
    );
  }
  if (!canAdjudicate) {
    return (
      <p className="text-xs text-muted-foreground">Read only · approval permission required</p>
    );
  }
  return (
    <div className={cn("flex items-center justify-end gap-1.5", mobile && "w-full")}>
      <Button
        size="sm"
        className={cn(
          mobile && "h-11 flex-1",
          !mobile && "text-success hover:bg-success/10 hover:text-success",
        )}
        variant={mobile ? "default" : "ghost"}
        onClick={() => approve(request.id)}
        disabled={busy}
      >
        <CheckCircle2 className="size-3.5" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className={cn(mobile && "h-11 flex-1")}
        onClick={() => deny(request)}
        disabled={busy}
      >
        <XCircle className="size-3.5" />
        Deny
      </Button>
    </div>
  );
}
