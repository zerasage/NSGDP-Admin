"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Globe,
  Loader2,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import {
  approveDocument,
  getDocumentBySlug,
  markDocumentUnderReview,
  publishDocument,
  rejectDocument,
  requestDocumentRevision,
  downloadDocument,
  type DocumentStatus,
} from "@/lib/api/documents";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EmptyState } from "@/components/feedback/empty-state";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  published: "Published",
  archived: "Archived",
};

export default function DocumentReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManage =
    user?.role === "super_admin" || hasPermission("manage:documents");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [comment, setComment] = useState("");

  const { data: document, isLoading, error } = useQuery({
    queryKey: ["document", slug],
    queryFn: () => getDocumentBySlug(slug),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["document", slug] });
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  const startReview = useMutation({
    mutationFn: () => markDocumentUnderReview(slug),
    onSuccess: () => {
      toast.success("Marked under review");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to start review"),
  });

  const approve = useMutation({
    mutationFn: () => approveDocument(slug),
    onSuccess: () => {
      toast.success("Document approved — publish when ready");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to approve"),
  });

  const publish = useMutation({
    mutationFn: () => publishDocument(slug),
    onSuccess: () => {
      toast.success("Document published to the public library");
      invalidate();
      router.push(`/documents/${slug}`);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to publish"),
  });

  const reject = useMutation({
    mutationFn: (reason: string) => rejectDocument(slug, reason),
    onSuccess: () => {
      toast.success("Document rejected");
      setRejectOpen(false);
      setComment("");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to reject"),
  });

  const revision = useMutation({
    mutationFn: (note: string) => requestDocumentRevision(slug, note),
    onSuccess: () => {
      toast.success("Revision requested — returned to draft");
      setRevisionOpen(false);
      setComment("");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to request revision"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <EmptyState
        icon={FileText}
        title="Document not found"
        description="This document may have been removed."
        action={{ label: "Back to documents", href: "/documents" }}
      />
    );
  }

  if (!canManage) {
    return (
      <EmptyState
        icon={FileText}
        title="Permission required"
        description="You need manage:documents to review submissions."
      />
    );
  }

  const inQueue =
    document.status === "pending" || document.status === "under_review";
  const canPublish =
    document.status === "approved" ||
    (document.status === "draft" && !!document.file_path);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/documents"
          className={cn(buttonVariants({ variant: "ghost" }), "h-9")}
        >
          <ArrowLeft className="size-4" />
          Documents
        </Link>
        <Badge variant="outline">{STATUS_LABEL[document.status]}</Badge>
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{document.title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {document.description}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Review details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Type" value={document.type} />
            <Row label="File" value={document.file_name ?? "No file attached"} />
            <Row
              label="Submitted"
              value={
                document.submitted_at
                  ? formatDate(document.submitted_at)
                  : "—"
              }
            />
            <Row
              label="Review comment"
              value={document.review_comment ?? "—"}
            />
            {document.file_path && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const { downloadUrl } = await downloadDocument(document.slug);
                    window.open(downloadUrl, "_blank", "noopener,noreferrer");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Download failed"
                    );
                  }
                }}
              >
                Download file
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {document.status === "pending" && (
              <Button
                onClick={() => startReview.mutate()}
                disabled={startReview.isPending}
              >
                {startReview.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Start review
              </Button>
            )}
            {inQueue && (
              <>
                <Button
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="size-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setComment("");
                    setRevisionOpen(true);
                  }}
                >
                  <RotateCcw className="size-4" />
                  Request revision
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setComment("");
                    setRejectOpen(true);
                  }}
                >
                  <XCircle className="size-4" />
                  Reject
                </Button>
              </>
            )}
            {canPublish && (
              <Button
                onClick={() => publish.mutate()}
                disabled={publish.isPending}
              >
                {publish.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Globe className="size-4" />
                )}
                Publish to library
              </Button>
            )}
            <Link
              href={`/documents/${slug}`}
              className={buttonVariants({ variant: "ghost" })}
            >
              Open detail page
            </Link>
          </CardContent>
        </Card>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject document</DialogTitle>
            <DialogDescription>
              The organisation will see this reason and can revise or abandon the
              submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!comment.trim() || reject.isPending}
              onClick={() => reject.mutate(comment.trim())}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request revision</DialogTitle>
            <DialogDescription>
              Returns the document to draft so the organisation can fix and
              resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="revision-comment">What needs changing?</Label>
            <Textarea
              id="revision-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!comment.trim() || revision.isPending}
              onClick={() => revision.mutate(comment.trim())}
            >
              Send revision request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}
