"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";

export interface ReviewHistoryEntry {
  actorId: string;
  actorName: string;
  actionType: string;
  comment: string | null;
  createdAt: string;
}

/**
 * Shared validate / approve / send-back / reject / request-revision /
 * mark-under-review mutations for the dataset review pages.
 * `invalidateKeys` lets each page decide what to refetch on success (the
 * list page and the detail page cache under different query keys).
 *
 * Two-tier review: validateMutation is the Validator's action
 * (pending/under_review -> validated, posts /validate); finalizeMutation and
 * sendBackMutation are the Approver's actions (validated -> approved, or
 * validated -> under_review with a required comment).
 */
export function useDatasetReview(invalidateKeys: unknown[][] = [["datasets"]]) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () =>
    invalidateKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

  const onError = (fallback: string) => (error: unknown) =>
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : fallback,
      variant: "destructive",
    });

  const validateMutation = useMutation({
    mutationFn: ({ slug, comment }: { slug: string; comment?: string }) =>
      apiClient.post(`/admin/datasets/${slug}/validate`, { comment }),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset validated successfully" });
      invalidate();
    },
    onError: onError("Failed to validate dataset"),
  });

  const finalizeMutation = useMutation({
    mutationFn: ({ slug, comment }: { slug: string; comment?: string }) =>
      apiClient.post(`/admin/datasets/${slug}/approve`, { comment }),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset approved successfully" });
      invalidate();
    },
    onError: onError("Failed to approve dataset"),
  });

  const sendBackMutation = useMutation({
    mutationFn: ({ slug, comment }: { slug: string; comment: string }) =>
      apiClient.post(`/admin/datasets/${slug}/send-back`, { comment }),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset sent back to under review" });
      invalidate();
    },
    onError: onError("Failed to send dataset back to under review"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
      apiClient.post(`/admin/datasets/${slug}/reject`, { reason }),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset rejected" });
      invalidate();
    },
    onError: onError("Failed to reject dataset"),
  });

  const requestRevisionMutation = useMutation({
    mutationFn: ({ slug, comment }: { slug: string; comment: string }) =>
      apiClient.post(`/admin/datasets/${slug}/request-revision`, { comment }),
    onSuccess: () => {
      toast({ title: "Success", description: "Revision requested — dataset returned to the owner" });
      invalidate();
    },
    onError: onError("Failed to request revision"),
  });

  const markUnderReviewMutation = useMutation({
    mutationFn: (slug: string) => apiClient.post(`/admin/datasets/${slug}/mark-under-review`, {}),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset marked as under review" });
      invalidate();
    },
    onError: onError("Failed to mark dataset as under review"),
  });

  return {
    validateMutation,
    finalizeMutation,
    sendBackMutation,
    rejectMutation,
    requestRevisionMutation,
    markUnderReviewMutation,
  };
}

/** Chronological, attributed comment history for a dataset's review. */
export function useReviewHistory(slug: string) {
  return useQuery({
    queryKey: ["datasets", slug, "review-history"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ReviewHistoryEntry[] }>(
        `/admin/datasets/${slug}/review-history`,
      );
      return response.data.data;
    },
    enabled: !!slug,
  });
}
