"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Globe, Loader2, Lock, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/feedback/empty-state";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { useDatasetReview } from "@/lib/hooks/useDatasetReview";
import { ApprovalPipeline } from "@/components/admin/approval-pipeline";
import { HelpTip } from "@/components/admin/help-tip";
import {
  APPROVE_DECISION_TIP,
  APPROVE_PAGE_TIP,
  APPROVE_PIPELINE_TIP,
  APPROVE_REJECT_TIP,
} from "@/lib/constants/review-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LifecycleBadge } from "@/components/data/lifecycle-badge";
import { toLifecycleStage } from "@/lib/utils/lifecycle-stage";
import type { DatasetStatus } from "@/lib/api/datasets";

interface Dataset {
  id: string;
  title: string;
  slug: string;
  status: DatasetStatus;
}

export default function DatasetApproveScreenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { can } = useAdminAccess();
  const canApprove = can("approve:datasets");
  const [showSendBack, setShowSendBack] = useState(false);
  const [sendBackComment, setSendBackComment] = useState("");
  const [approveComment, setApproveComment] = useState("");

  const { data: dataset, isLoading, error } = useQuery({
    queryKey: ["dataset", slug],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Dataset }>(`/admin/datasets/${slug}`);
      return response.data.data;
    },
  });

  const { finalizeMutation, sendBackMutation } = useDatasetReview([["dataset", slug]]);

  const isValidated = dataset?.status === "validated";

  const handleApprove = () => {
    finalizeMutation.mutate(
      { slug, comment: approveComment.trim() || undefined },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Dataset approved — publish it from the dataset page to make it public",
          });
          router.push(`/datasets/${slug}`);
        },
        onError: (error: unknown) =>
          toast({
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "You may not have approval permission for this action.",
            variant: "destructive",
          }),
      }
    );
  };

  const handleSendBack = () => {
    if (sendBackComment.length < 20) {
      toast({
        title: "Error",
        description: "Comment must be at least 20 characters",
        variant: "destructive",
      });
      return;
    }
    sendBackMutation.mutate(
      { slug, comment: sendBackComment },
      {
        onSuccess: () => {
          router.push("/datasets");
        },
      }
    );
  };

  if (!canApprove) {
    return (
      <EmptyState
        icon={Lock}
        title="Access restricted"
        description="Giving final approval requires the approve:datasets permission. Ask a super_admin to grant your group this permission."
      />
    );
  }

  if (isLoading) {
    return <Skeleton className="h-64" />;
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
    <TooltipProvider delay={200}>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/datasets/${slug}`)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            Final Approval
            <HelpTip content={APPROVE_PAGE_TIP} label="About final approval" />
          </h1>
          <p className="text-sm text-muted-foreground">{dataset.title}</p>
        </div>
        <div className="ml-auto">
          <LifecycleBadge stage={toLifecycleStage(dataset.status)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Approval Pipeline
            <HelpTip content={APPROVE_PIPELINE_TIP} label="About approval pipeline" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalPipeline currentStage={toLifecycleStage(dataset.status)} />
        </CardContent>
      </Card>

      {!isValidated ? (
        <Alert>
          <AlertDescription>
            This dataset isn&apos;t awaiting final approval right now — its current status is{" "}
            <span className="font-medium">{dataset.status.replace("_", " ")}</span>. A Validator
            needs to mark it Validated before it can be approved or sent back here.
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
          <CardContent className="pt-6">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              A Validator has passed this dataset through the 8-dimension QA checklist and is
              awaiting your final sign-off. Approving does not make it public — publish it
              separately from the dataset page when it&apos;s ready to go live.
            </p>
          </CardContent>
        </Card>
      )}

      {isValidated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approval comment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="approve-comment">Comment <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="approve-comment"
              rows={3}
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              placeholder="Any notes for the record or the submitting team…"
            />
          </CardContent>
        </Card>
      )}

      {showSendBack && (
        <Card>
          <CardHeader><CardTitle className="text-base text-destructive">Send back to under review</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={3}
              value={sendBackComment}
              onChange={(e) => setSendBackComment(e.target.value)}
              placeholder="Explain what needs another look before this comes back (minimum 20 characters)…"
            />
            <p className="text-sm text-muted-foreground">{sendBackComment.length}/20 characters minimum</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSendBack(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleSendBack}
                disabled={sendBackMutation.isPending || sendBackComment.length < 20}
              >
                Confirm send back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            onClick={() => setShowSendBack(true)}
            className="text-destructive"
            disabled={!isValidated}
          >
            <Undo2 className="size-4 mr-1.5" />
            Send back to under review
          </Button>
          <HelpTip content={APPROVE_REJECT_TIP} label="About send back to under review" />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button onClick={handleApprove} disabled={!isValidated || finalizeMutation.isPending}>
            {finalizeMutation.isPending ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Globe className="size-4 mr-1.5" />
            )}
            Approve
          </Button>
          <HelpTip content={APPROVE_DECISION_TIP} label="About approve" />
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
