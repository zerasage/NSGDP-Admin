"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  Loader2,
  Undo2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Panel,
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
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<"approve" | "deny">("approve");
  const [reviewComment, setReviewComment] = useState("");

  const { data, isLoading } = useArchiveRequests({
    status: tab === "all" ? undefined : tab,
    page,
    limit: 20,
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Requests"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : total}
            tone="muted"
            icon={Undo2}
            tip={TABS.find(t => t.key === "all")?.tip}
          />
          <MetricCard
            label="Pending Review"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : pendingCount}
            tone="warning"
            icon={AlertCircle}
            tip={TABS.find(t => t.key === "pending")?.tip}
          />
          <MetricCard
            label="Approved"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : approvedCount}
            tone="success"
            icon={CheckCircle2}
            tip={TABS.find(t => t.key === "approved")?.tip}
          />
          <MetricCard
            label="Denied"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : deniedCount}
            tone="destructive"
            icon={XCircle}
            tip={TABS.find(t => t.key === "denied")?.tip}
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setTab(item.key);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                tab === item.key
                  ? tabToneClass(item.tone)
                  : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <Panel 
          title="Request Queue" 
          titleTip="Review the reason and dataset details before approving or denying each request"
        >
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={6} />
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12">
                      <EmptyState
                        icon={Undo2}
                        title={tab === "pending" ? "No pending requests" : "No requests found"}
                        description={
                          tab === "pending" 
                            ? "There are no archive requests awaiting review at the moment."
                            : "No archive requests match the current filter."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const status = STATUS_CONFIG[row.status];
                    const requesterName = row.requester
                      ? [row.requester.first_name, row.requester.last_name]
                          .filter(Boolean)
                          .join(" ") || row.requester.email
                      : "Unknown";
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
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
                        <TableCell>
                          <div className="text-sm">{requesterName}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.requester?.email}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
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
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn("border text-xs", METRIC_TONE[status.tone].well, METRIC_TONE[status.tone].icon)}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(row.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
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
                  })
                )}
              </TableBody>
            </Table>
          </DataTableShell>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              pageSize={20}
              total={total}
              onPageChange={setPage}
              className="mt-4"
            />
          )}
        </Panel>

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
