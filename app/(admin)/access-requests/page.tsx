"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Lock, Search, UserRound, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback/empty-state";
import { Pagination } from "@/components/data/pagination";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useAccessRequests, useApproveAccessRequest, useDenyAccessRequest } from "@/lib/hooks/useAccessRequests";
import type { AccessRequest, AccessRequestStatus } from "@/lib/api/access-requests";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";

const STATUS_CONFIG: Record<AccessRequestStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning text-warning-foreground" },
  approved: { label: "Approved", className: "bg-success text-success-foreground" },
  denied: { label: "Denied", className: "bg-destructive text-white" },
};

const TABS: Array<{ key: AccessRequestStatus | "all"; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "denied", label: "Denied" },
  { key: "all", label: "All requests" },
];

function StatusBadge({ status }: { status: AccessRequestStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", className)}>{label}</span>;
}

export default function AccessRequestsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, isLoading: permissionsLoading } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";
  const canAdjudicate = isSuperAdmin || hasPermission("approve:access-requests");
  const canView = isSuperAdmin || hasAnyPermission("view:access-requests", "approve:access-requests");
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

  const request = useAccessRequests({ status: status === "all" ? undefined : status, page, limit: pageSize, search: debouncedQuery || undefined }, canView);
  const approveMutation = useApproveAccessRequest();
  const denyMutation = useDenyAccessRequest();
  const requests = request.data?.data ?? [];
  const meta = request.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  const isSearchPending = query.trim() !== debouncedQuery;

  const approve = (id: string) => approveMutation.mutate(id, {
    onSuccess: () => toast({ title: "Access request approved" }),
    onError: (error) => toast({ title: "Could not approve request", description: error instanceof Error ? error.message : undefined, variant: "destructive" }),
  });
  const closeDialog = () => { setDenyTarget(null); setComment(""); setCommentTouched(false); };
  const deny = () => {
    setCommentTouched(true);
    if (!denyTarget || comment.trim().length < 20) return;
    denyMutation.mutate({ id: denyTarget.id, comment: comment.trim() }, {
      onSuccess: () => { toast({ title: "Access request denied" }); closeDialog(); },
      onError: (error) => toast({ title: "Could not deny request", description: error instanceof Error ? error.message : undefined, variant: "destructive" }),
    });
  };

  if (!permissionsLoading && !canView) {
    return (
      <EmptyState
        icon={Lock}
        title="Access restricted"
        description="Viewing access requests requires view:access-requests or approve:access-requests. Ask a super_admin to grant your group one of these."
      />
    );
  }

  const filtered = Boolean(debouncedQuery || status !== "all");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Access requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review requests for restricted datasets</p>
        </div>
        {!request.isLoading && (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
            {total} {total === 1 ? "request" : "requests"}
          </Badge>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="scrollbar-slim overflow-x-auto border-b px-4">
          <div className="flex min-w-max gap-1" role="tablist" aria-label="Request status">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={status === tab.key}
                onClick={() => { setStatus(tab.key); setPage(1); }}
                className={cn(
                  "relative px-3 py-3 text-sm font-medium transition-colors",
                  status === tab.key
                    ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
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

      <div aria-busy={request.isFetching || isSearchPending} className="space-y-4">
        {request.isLoading ? (
          <>
            <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
              <table className="w-full text-sm">
                <tbody>{[...Array(6)].map((_, i) => <TableRowSkeleton key={i} cols={6} />)}</tbody>
              </table>
            </div>
            <div className="grid gap-3 xl:hidden">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          </>
        ) : request.isError ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <p className="font-semibold text-destructive">Access requests could not be loaded.</p>
            <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => request.refetch()}>Retry</Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={KeyRound}
              title={filtered ? "No matching requests" : "No access requests yet"}
              description={filtered ? "Try another search or status filter." : "New requests will appear here when users request restricted dataset access."}
              action={query ? { label: "Clear search", onClick: () => setQuery("") } : undefined}
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border bg-card xl:block">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="h-11 border-b bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 font-semibold">Requester</th>
                    <th className="px-4 font-semibold">Dataset</th>
                    <th className="px-4 font-semibold">Reason</th>
                    <th className="px-4 font-semibold">Status</th>
                    <th className="px-4 font-semibold">Requested</th>
                    <th className="px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                      <td className="max-w-56 px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <UserRound className="size-4 text-primary" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-semibold">{r.requester_name || "Unnamed requester"}</p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.requester_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-56 px-4 py-3.5">
                        <span className="line-clamp-2 font-medium">{r.dataset_title}</span>
                      </td>
                      <td className="max-w-sm px-4 py-3.5 text-muted-foreground">
                        <span className="line-clamp-2" title={r.reason}>{r.reason}</span>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <Actions request={r} canAdjudicate={canAdjudicate} busy={approveMutation.isPending || denyMutation.isPending} approve={approve} deny={setDenyTarget} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 xl:hidden">
              {requests.map((r) => (
                <article key={r.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <UserRound className="size-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold leading-5">{r.requester_name || "Unnamed requester"}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{r.requester_email}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{r.reason}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-y py-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Dataset</p>
                      <p className="mt-1 line-clamp-1 text-xs font-medium">{r.dataset_title}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Requested</p>
                      <p className="mt-1 text-xs font-medium">{formatDate(r.created_at)}</p>
                    </div>
                  </div>

                  {r.review_comment && (
                    <p className="mt-3 text-xs text-muted-foreground">Review note: {r.review_comment}</p>
                  )}

                  <div className="mt-4">
                    <Actions request={r} canAdjudicate={canAdjudicate} busy={approveMutation.isPending || denyMutation.isPending} approve={approve} deny={setDenyTarget} mobile />
                  </div>
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
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            className="rounded-xl border bg-card px-4 py-3"
          />
        )}
      </div>

      <Dialog open={Boolean(denyTarget)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deny access request</DialogTitle>
            <DialogDescription>Tell the requester why access to {denyTarget?.dataset_title} cannot be granted.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="deny-comment">Denial reason <span className="font-normal text-destructive">Required</span></Label>
            <Textarea
              id="deny-comment"
              value={comment}
              onChange={(e) => { setComment(e.target.value); setCommentTouched(true); }}
              onBlur={() => setCommentTouched(true)}
              rows={5}
              aria-describedby="deny-help deny-error"
              aria-invalid={commentTouched && comment.trim().length < 20}
              placeholder="Give a specific reason the requester can act on…"
              className={cn(commentTouched && comment.trim().length < 20 && "border-destructive")}
            />
            <p id="deny-help" className="text-xs text-muted-foreground">Minimum 20 characters · {comment.trim().length}/20</p>
            {commentTouched && comment.trim().length < 20 && <p id="deny-error" className="text-sm text-destructive">Enter at least 20 characters.</p>}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" className="h-11 w-full sm:h-9 sm:w-auto" onClick={closeDialog}>Cancel</Button>
            <Button variant="destructive" className="h-11 w-full sm:h-9 sm:w-auto" onClick={deny} disabled={denyMutation.isPending}>
              {denyMutation.isPending ? <><Loader2 className="size-4 animate-spin" />Denying…</> : "Deny request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Actions({ request, canAdjudicate, busy, approve, deny, mobile = false }: { request: AccessRequest; canAdjudicate: boolean; busy: boolean; approve: (id: string) => void; deny: (request: AccessRequest) => void; mobile?: boolean }) {
  if (request.status !== "pending") return <span className="text-xs text-muted-foreground">{request.review_comment || "Review complete"}</span>;
  if (!canAdjudicate) return <p className="text-xs text-muted-foreground">Read only · approval permission required</p>;
  return (
    <div className={cn("flex items-center gap-1.5", mobile && "w-full")}>
      <Button size="sm" className={cn(mobile && "h-11 flex-1")} onClick={() => approve(request.id)} disabled={busy}>
        <CheckCircle2 className="size-3.5" />Approve
      </Button>
      <Button size="sm" variant="destructive" className={cn(mobile && "h-11 flex-1")} onClick={() => deny(request)} disabled={busy}>
        <XCircle className="size-3.5" />Deny
      </Button>
    </div>
  );
}
