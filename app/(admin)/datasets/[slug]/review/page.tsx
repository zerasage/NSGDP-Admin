"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Archive, CheckCircle2, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { apiClient } from "@/lib/api/client";
import { adminApi, archiveDataset } from "@/lib/api/admin";
import { getCategories } from "@/lib/api/categories";
import { useToast } from "@/lib/hooks/use-toast";
import { useDatasetReview } from "@/lib/hooks/useDatasetReview";
import { useSaveQAChecklist } from "@/lib/hooks/useQAChecklist";
import { ApprovalPipeline } from "@/components/admin/approval-pipeline";
import { LifecycleBadge } from "@/components/data/lifecycle-badge";
import { QAChecklistItem, type QAResult } from "@/components/data/qa-checklist-item";
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
    if (dataset?.status === "pending" && !markUnderReviewMutation.isPending) {
      markUnderReviewMutation.mutate(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset?.status]);

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
    archiveDataset(slug)
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/datasets")} aria-label="Back to Review Queue">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Review Dataset</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dataset.title}</p>
        </div>
        <div className="ml-auto">
          <LifecycleBadge stage={stage} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Approval Pipeline
            <HelpTooltip content="Five practical stages. The QA checklist below replaces separate metadata, technical, and quality gates — complete all 8 dimensions in one review session." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalPipeline currentStage={stage} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3">
            {[
              ["Organisation", organisation?.name ?? "—"],
              ["Category", category?.name ?? "—"],
              ["Format", dataset.format?.toUpperCase()],
              ["Visibility", dataset.visibility],
              ["License", dataset.license ?? "—"],
              ["Submitted", dataset.submitted_at ? new Date(dataset.submitted_at).toLocaleDateString() : new Date(dataset.created_at).toLocaleDateString()],
              ["Coverage", dataset.geographic_coverage?.length ? `${dataset.geographic_coverage.length} location(s)` : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-medium capitalize">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Quality Assurance Checklist
            <HelpTooltip content="Score all 8 governance dimensions in this single review. This replaces separate metadata, technical, and QA micro-stages." />
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{passCount} Pass</span>
            <span className="text-destructive font-semibold">{failCount} Fail</span>
            <span className="text-muted-foreground">{naCount} N/A</span>
            <span className="text-muted-foreground">{pendingCount} Pending</span>
          </div>
        </div>

        <div className="space-y-3">
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
      </div>

      <div className="flex flex-wrap gap-3 justify-between border-t pt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setRevisionOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <XCircle className="size-4 mr-1.5" />
            Request Revision
          </Button>
          <Button variant="outline" onClick={() => setArchiveOpen(true)}>
            <Archive className="size-4 mr-1.5" />
            Archive
          </Button>
        </div>
        <Button onClick={handleSendForApproval} disabled={!canSendForApproval || saveChecklistMutation.isPending}>
          <CheckCircle2 className="size-4 mr-1.5" />
          Send for Director Approval
          <Send className="size-4 ml-1.5" />
        </Button>
      </div>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>Describe the revisions needed. The submitter will receive this feedback.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="revision-comment">
              Comment <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="revision-comment"
              rows={4}
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              placeholder="E.g. Reporting period is missing. LGA names must match official list…"
            />
            <p className="text-sm text-muted-foreground">{revisionComment.length}/20 characters minimum</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRequestRevision}
              disabled={requestRevisionMutation.isPending || revisionComment.length < 20}
            >
              Send Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Dataset</DialogTitle>
            <DialogDescription>
              Archived datasets are removed from the public catalogue but remain accessible to admins.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              rows={3}
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Reason for archiving… (not yet stored by the backend — display only)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>Cancel</Button>
            <Button onClick={handleArchive}>Archive Dataset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
