"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";

/**
 * Shared approve / reject / request-revision / mark-under-review mutations
 * for the dataset review pages. `invalidateKeys` lets each page decide what
 * to refetch on success (the list page and the detail page cache under
 * different query keys).
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

  const approveMutation = useMutation({
    mutationFn: ({ slug, comment }: { slug: string; comment?: string }) =>
      apiClient.post(`/admin/datasets/${slug}/approve`, { comment }),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset approved successfully" });
      invalidate();
    },
    onError: onError("Failed to approve dataset"),
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

  return { approveMutation, rejectMutation, requestRevisionMutation, markUnderReviewMutation };
}
