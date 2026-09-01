"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Globe, Loader2, Lock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/feedback/empty-state";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { useDatasetReview } from "@/lib/hooks/useDatasetReview";
import { ApprovalPipeline } from "@/components/admin/approval-pipeline";
import { LifecycleBadge } from "@/components/data/lifecycle-badge";
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
  const { user } = useAuth();
  const { can } = useAdminAccess();
  const canApprove = can("approve:datasets");
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: dataset, isLoading, error } = useQuery({
    queryKey: ["dataset", slug],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Dataset }>(`/admin/datasets/${slug}`);
      return response.data.data;
    },
  });

  const { approveMutation, rejectMutation } = useDatasetReview([["dataset", slug]]);

  const handleApprove = () => {
    approveMutation.mutate(
      { slug },
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

  const handleReject = () => {
    if (rejectReason.length < 20) {
      toast({
        title: "Error",
        description: "Rejection reason must be at least 20 characters",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate(
      { slug, reason: rejectReason },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Dataset returned for revision" });
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
        description="Approving or rejecting datasets requires the approve:datasets permission. Ask a super_admin to grant your group this permission."
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/datasets/${slug}/review`)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Director Approval</h1>
          <p className="text-sm text-muted-foreground">{dataset.title}</p>
        </div>
        <div className="ml-auto">
          <LifecycleBadge stage="approved" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Approval Pipeline</CardTitle></CardHeader>
        <CardContent>
          <ApprovalPipeline currentStage="approved" />
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
        <CardContent className="pt-6">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            This dataset passed the 8-dimension QA checklist in a single review session and is
            awaiting director sign-off. Approving does not make it public — publish it separately
            from the dataset page when it&apos;s ready to go live.
          </p>
        </CardContent>
      </Card>

      {showReject && (
        <Card>
          <CardHeader><CardTitle className="text-base text-destructive">Rejection Reason</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this dataset is being returned (minimum 20 characters)…"
            />
            <p className="text-sm text-muted-foreground">{rejectReason.length}/20 characters minimum</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending || rejectReason.length < 20}
              >
                Confirm Rejection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 border-t pt-4">
        <Button variant="outline" onClick={() => setShowReject(true)} className="text-destructive">
          <XCircle className="size-4 mr-1.5" />
          Reject
        </Button>
        <Button className="ml-auto" onClick={handleApprove} disabled={approveMutation.isPending}>
          {approveMutation.isPending ? (
            <Loader2 className="size-4 animate-spin mr-1.5" />
          ) : (
            <Globe className="size-4 mr-1.5" />
          )}
          Approve
        </Button>
      </div>
    </div>
  );
}
