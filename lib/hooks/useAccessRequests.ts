import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccessRequests,
  approveAccessRequest,
  denyAccessRequest,
  type AccessRequestStatus,
} from '../api/access-requests';

export function useAccessRequests(
  params?: { status?: AccessRequestStatus; page?: number; limit?: number; search?: string },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['access-requests', params],
    queryFn: () => getAccessRequests(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useApproveAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveAccessRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-requests'] }),
  });
}

export function useDenyAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => denyAccessRequest(id, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-requests'] }),
  });
}
