"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Archive, CheckCircle2, Lock, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { EmptyState } from "@/components/feedback/empty-state";
import { apiClient } from "@/lib/api/client";
import { adminApi, archiveDataset } from "@/lib/api/admin";
import { getCategories } from "@/lib/api/categories";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useDatasetReview } from "@/lib/hooks/useDatasetReview";
import { useSaveQAChecklist } from "@/lib/hooks/useQAChecklist";
import { ApprovalPipeline } from "@/components/admin/approval-pipeline";
import { LifecycleBadge } from "@/components/data/lifecycle-badge";
import { QAChecklistItem, type QAResult } from "@/components/data/qa-checklist-item";
import { formatDate } from "@/lib/utils/date";
import { DatasetPreviewCard } from "@/components/data/dataset-preview-card";
import { QA_DIMENSIONS, isQAChecklistPassed } from "@/lib/constants/qa-checklist";
import { HelpTooltip } from "@/components/feedback/help-tooltip";
import { toLifecycleStage } from "@/lib/utils/lifecycle-stage";
import type { LifecycleStage } from "@/types";
import type { DatasetStatus } from "@/lib/api/datasets";

interface Dataset {
  id: string;
  title: string;
  slug: string;
  format: string;
  visibility: string;
  status: DatasetStatus;
  license: string;
  geographic_coverage: string[];
  organisation_id: string;
  category_id: string;
  owner_id: string;
  created_at: string;
  submitted_at?: string;
}

interface Organisation {
  id: string;
  name: string;
}

type QAState = Record<string, { result: QAResult; notes: string }>;

function initQAState(): QAState {
  return Object.fromEntries(
    QA_DIMENSIONS.map((d) => [d.id, { result: "pending" as QAResult, notes: "" }])
  );
}

export default function DatasetReviewScreenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";
  const canApprove = isSuperAdmin || hasPermission("approve:datasets");
  const canArchive = isSuperAdmin || hasPermission("archive:datasets");

  const [stageOverride, setStageOverride] = useState<LifecycleStage | null>(null);
  const [qa, setQA] = useState<QAState>(initQAState());
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");

  const { data: dataset, isLoading, error } = useQuery({
    queryKey: ["dataset", slug],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Dataset }>(`/admin/datasets/${slug}`);
      return response.data.data;
    },
  });

  const { data: organisationsData } = useQuery({
    queryKey: ["admin", "organisations"],
    queryFn: async () => {
      const response = await adminApi.get<{ data: { data: Organisation[] } }>("/admin/organisations?page=1&limit=100");
      return response.data.data;
    },
  });

  const organisation = organisationsData?.data?.find((o) => o.id === dataset?.organisation_id);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories({ page: 1, limit: 100 }),
  });

  const category = categoriesData?.data?.find((c) => c.id === dataset?.category_id);

  const { markUnderReviewMutation, requestRevisionMutation } = useDatasetReview([
    ["dataset", slug],
  ]);
  const saveChecklistMutation = useSaveQAChecklist();

  const stage: LifecycleStage = stageOverride ?? (dataset ? toLifecycleStage(dataset.status) : "under_review");

  // Opening the review screen means active review — mirrors the prototype's intent,
  // now backed by a real transition instead of local-only state.
  useEffect(() => {
    if (canApprove && dataset?.status === "pending" && !markUnderReviewMutation.isPending) {
      markUnderReviewMutation.mutate(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset?.status, canApprove]);

  const passCount = Object.values(qa).filter((v) => v.result === "pass").length;
  const failCount = Object.values(qa).filter((v) => v.result === "fail").length;
  const naCount = Object.values(qa).filter((v) => v.result === "na").length;
  const pendingCount = Object.values(qa).filter((v) => v.result === "pending").length;
  const allChecksPassed = isQAChecklistPassed(qa);
  const canSendForApproval = allChecksPassed && stage === "under_review";

  const handleSendForApproval = () => {
    const items = QA_DIMENSIONS.map((d) => ({
      dimensionId: d.id,
      result: qa[d.id].result,
      notes: qa[d.id].notes || undefined,
    }));
    saveChecklistMutation.mutate(
      { slug, items },
      {
        onSuccess: () => {
          setStageOverride("approved");
          toast({ title: "Success", description: "QA checklist complete — sent for director approval" });
          router.push(`/datasets/${slug}/approve`);
        },
        onError: (error: unknown) =>
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to save checklist",
            variant: "destructive",
          }),
      }
    );
  };

  const handleRequestRevision = () => {
    if (revisionComment.length < 20) {
      toast({
        title: "Error",
        description: "Revision comment must be at least 20 characters",
        variant: "destructive",
      });
      return;
    }
    requestRevisionMutation.mutate(
      { slug, comment: revisionComment },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Dataset returned to submitter with revision request" });
          router.push("/datasets");
        },
      }
    );
  };

  const handleArchive = () => {
    archiveDataset(slug, archiveReason.trim() || undefined)
      .then(() => {
        toast({ title: "Success", description: "Dataset archived" });
        router.push("/datasets");
      })
      .catch((error: unknown) =>
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to archive dataset",
          variant: "destructive",
        })
      );
  };

  if (!canApprove) {
    return (
      <EmptyState
        icon={Lock}
        title="Access restricted"
        description="Reviewing datasets requires the approve:datasets permission. Ask a super_admin to grant your group this permission."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-full max-w-xl" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <Skeleton className="h-[40rem] rounded-2xl" />
          <Skeleton className="h-[32rem] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>Dataset not found or you don&apos;t have permission to view it.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-3 gap-1.5" onClick={() => router.push("/datasets")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Review queue
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-8">Review dataset</h1>
            <p className="mt-1 text-sm text-muted-foreground">{dataset.title}</p>
          </div>
          <LifecycleBadge stage={stage} />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            Approval pipeline
            <HelpTooltip content="Five practical stages. The QA checklist below replaces separate metadata, technical, and quality gates — complete all 8 dimensions in one review session." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalPipeline currentStage={stage} />
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="min-w-0 space-y-6">
          <DatasetPreviewCard slug={slug} showDownload />

          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  Quality assurance checklist
                  <HelpTooltip content="Score all 8 governance dimensions in this single review. This replaces separate metadata, technical, and QA micro-stages." />
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1.5 text-xs tabular-nums">
                  <Badge variant="outline">{passCount} pass</Badge>
                  <Badge variant="outline">{failCount} fail</Badge>
                  <Badge variant="outline">{naCount} N/A</Badge>
                  <Badge variant="secondary">{pendingCount} pending</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y">
                {QA_DIMENSIONS.map((dim) => (
                  <QAChecklistItem
                    key={dim.id}
                    dimension={dim}
                    result={qa[dim.id].result}
                    notes={qa[dim.id].notes}
                    onResultChange={(result) =>
                      setQA((prev) => ({ ...prev, [dim.id]: { ...prev[dim.id], result } }))
                    }
                    onNotesChange={(notes) =>
                      setQA((prev) => ({ ...prev, [dim.id]: { ...prev[dim.id], notes } }))
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Submission summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y text-sm">
                {[
                  ["Organisation", organisation?.name ?? "Not provided"],
                  ["Category", category?.name ?? "Not provided"],
                  ["Format", dataset.format?.toUpperCase()],
                  ["Visibility", dataset.visibility],
                  ["License", dataset.license ?? "Not provided"],
                  ["Submitted", dataset.submitted_at ? formatDate(dataset.submitted_at) : formatDate(dataset.created_at)],
                  ["Coverage", dataset.geographic_coverage?.length ? `${dataset.geographic_coverage.length} location(s)` : "Not provided"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                    <dd className="text-right text-sm font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Review decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Checklist progress</span>
                  <span className="font-semibold tabular-nums">{QA_DIMENSIONS.length - pendingCount}/{QA_DIMENSIONS.length}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${((QA_DIMENSIONS.length - pendingCount) / QA_DIMENSIONS.length) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {canSendForApproval
                  ? "All required checks passed. The dataset is ready for the director's decision."
                  : "Complete every check with no failures before sending this dataset for director approval."}
              </p>
              <Button
                className="h-11 w-full gap-1.5 sm:h-9"
                onClick={handleSendForApproval}
                disabled={!canSendForApproval || saveChecklistMutation.isPending}
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Send for director approval
                <Send className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full gap-1.5 text-destructive hover:text-destructive sm:h-9"
                onClick={() => setRevisionOpen(true)}
              >
                <XCircle className="size-4" aria-hidden="true" />
                Request revision
              </Button>
              {canArchive && (
                <Button variant="ghost" className="h-11 w-full gap-1.5 sm:h-9" onClick={() => setArchiveOpen(true)}>
                  <Archive className="size-4" aria-hidden="true" />
                  Archive dataset
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request revision</DialogTitle>
            <DialogDescription>Describe the revisions needed. The submitter will receive this feedback.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="revision-comment">Revision feedback <span className="text-muted-foreground">(required)</span></Label>
            <Textarea
              id="revision-comment"
              rows={4}
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              placeholder="E.g. Reporting period is missing. LGA names must match official list…"
              aria-required="true"
            />
            <p className="text-xs text-muted-foreground">{revisionComment.length}/20 characters minimum</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRequestRevision}
              disabled={requestRevisionMutation.isPending || revisionComment.length < 20}
            >
              Send revision request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Archive dataset</DialogTitle>
            <DialogDescription>
              Archived datasets are removed from the public catalogue but remain accessible to admins.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="archive-reason">Reason <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="archive-reason"
              rows={3}
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Explain why this dataset is being archived"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleArchive}>Archive dataset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
