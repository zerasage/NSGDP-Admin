"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Download, Eye, FileText, MapPin, Tag, User, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/lib/hooks/use-toast";

interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  format: string;
  visibility: string;
  status: string;
  tags: string[];
  geographic_coverage: string[];
  license: string;
  owner_id: string;
  organisation_id: string;
  created_at: string;
  updated_at: string;
  download_count: number;
}

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');

  // Fetch dataset details (using admin endpoint to see all statuses)
  const { data: dataset, isLoading, error } = useQuery({
    queryKey: ['dataset', slug],
    queryFn: async () => {
      const response = await apiClient.get<any>(`/admin/datasets/${slug}`);
      return response.data.data as Dataset;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ slug, comment }: { slug: string; comment?: string }) =>
      apiClient.post(`/admin/datasets/${slug}/approve`, { comment }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Dataset approved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['dataset', slug] });
      setReviewAction(null);
      setComment('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve dataset',
        variant: 'destructive',
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
      apiClient.post(`/admin/datasets/${slug}/reject`, { reason }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Dataset rejected',
      });
      queryClient.invalidateQueries({ queryKey: ['dataset', slug] });
      setReviewAction(null);
      setReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject dataset',
        variant: 'destructive',
      });
    },
  });

  const handleConfirmReview = () => {
    if (!dataset) return;

    if (reviewAction === 'approve') {
      approveMutation.mutate({ slug: dataset.slug, comment });
    } else if (reviewAction === 'reject') {
      if (reason.length < 20) {
        toast({
          title: 'Error',
          description: 'Rejection reason must be at least 20 characters',
          variant: 'destructive',
        });
        return;
      }
      rejectMutation.mutate({ slug: dataset.slug, reason });
    }
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Dataset not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 border-gray-300",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    under_review: "bg-blue-100 text-blue-800 border-blue-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
    archived: "bg-gray-100 text-gray-600 border-gray-300",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 -ml-3"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{dataset.title}</h1>
          <p className="text-muted-foreground mt-1">Dataset Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[dataset.status] || "bg-gray-100 text-gray-800"}>
            {dataset.status.replace('_', ' ').toUpperCase()}
          </Badge>
          
          {/* Show approve/reject buttons for pending or under_review datasets */}
          {(dataset.status === 'pending' || dataset.status === 'under_review') && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => setReviewAction('approve')}
                disabled={approveMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setReviewAction('reject')}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{dataset.description}</p>
            </CardContent>
          </Card>

          {dataset.tags && dataset.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="size-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dataset.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {dataset.geographic_coverage && dataset.geographic_coverage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Geographic Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dataset.geographic_coverage.map((location, index) => (
                    <Badge key={index} variant="outline">
                      {location}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dataset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Format</p>
                <Badge variant="secondary" className="uppercase">
                  {dataset.format}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Visibility</p>
                <Badge variant="outline" className="capitalize">
                  {dataset.visibility}
                </Badge>
              </div>

              {dataset.license && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">License</p>
                  <p className="text-sm">{dataset.license}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <Download className="size-4" />
                <span>{dataset.download_count || 0} downloads</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                <span>
                  Created {new Date(dataset.created_at).toLocaleDateString()}
                </span>
              </div>

              {dataset.updated_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>
                    Updated {new Date(dataset.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {dataset.status === 'draft' && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800">
                  <strong>Draft Status:</strong> This dataset is not yet published and is only visible to administrators.
                </p>
              </CardContent>
            </Card>
          )}

          {dataset.status === 'pending' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-800">
                  <strong>Pending Review:</strong> This dataset is awaiting review and approval.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewAction !== null} onOpenChange={() => {
        setReviewAction(null);
        setComment('');
        setReason('');
      }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Dataset' : 'Reject Dataset'}
            </DialogTitle>
            <DialogDescription>
              {dataset.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {reviewAction === 'approve' ? (
              <div className="space-y-2">
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Add any notes or feedback for the submitter..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Rejection Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Provide a detailed reason for rejection (minimum 20 characters)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={6}
                  className={reason.length > 0 && reason.length < 20 ? 'border-destructive' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  {reason.length}/20 characters minimum
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewAction(null);
                setComment('');
                setReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleConfirmReview}
              disabled={
                approveMutation.isPending ||
                rejectMutation.isPending ||
                (reviewAction === 'reject' && reason.length < 20)
              }
            >
              {(approveMutation.isPending || rejectMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {reviewAction === 'approve' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve Dataset
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Dataset
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
