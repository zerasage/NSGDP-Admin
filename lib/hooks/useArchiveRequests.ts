"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveArchiveRequest,
  denyArchiveRequest,
  getArchiveRequests,
  type ArchiveRequestStatus,
} from "@/lib/api/archive-requests";

export function useArchiveRequests(params?: {
  status?: ArchiveRequestStatus | "all";
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...query } = params ?? {};
  return useQuery({
    queryKey: ["archive-requests", query],
    queryFn: () => getArchiveRequests(query),
    enabled,
  });
}

export function useApproveArchiveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reviewComment,
    }: {
      id: string;
      reviewComment?: string;
    }) => approveArchiveRequest(id, reviewComment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-nav-badge"] });
    },
  });
}

export function useDenyArchiveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reviewComment,
    }: {
      id: string;
      reviewComment?: string;
    }) => denyArchiveRequest(id, reviewComment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-nav-badge"] });
    },
  });
}
