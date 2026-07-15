import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsers,
  getUserStats,
  getUserById,
  updateUserRole,
  updateUserStatus,
  getReviewQueue,
  approveDataset,
  rejectDataset,
  requestRevision,
  getAuditLogs,
  exportAuditLogs,
  type UserListParams,
  type UpdateUserRoleDto,
  type UpdateUserStatusDto,
  type ReviewQueueParams,
  type ApproveDatasetDto,
  type RejectDatasetDto,
  type ReviseDatasetDto,
  type AuditLogParams,
} from '../api/admin';

/**
 * Hook to fetch users with filters and pagination
 */
export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => getUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch user statistics
 */
export function useUserStats() {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: getUserStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRoleDto }) =>
      updateUserRole(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    },
  });
}

/**
 * Hook to update user status
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserStatusDto }) =>
      updateUserStatus(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    },
  });
}

/**
 * Hook to fetch review queue
 */
export function useReviewQueue(params?: ReviewQueueParams) {
  return useQuery({
    queryKey: ['admin-review-queue', params],
    queryFn: () => getReviewQueue(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to approve a dataset
 */
export function useApproveDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, data }: { datasetId: string; data?: ApproveDatasetDto }) =>
      approveDataset(datasetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}

/**
 * Hook to reject a dataset
 */
export function useRejectDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, data }: { datasetId: string; data: RejectDatasetDto }) =>
      rejectDataset(datasetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}

/**
 * Hook to request dataset revision
 */
export function useRequestRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, data }: { datasetId: string; data: ReviseDatasetDto }) =>
      requestRevision(datasetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}

/**
 * Hook to fetch audit logs
 */
export function useAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: ['admin-audit-logs', params],
    queryFn: () => getAuditLogs(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to export audit logs as CSV
 */
export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (params?: Omit<AuditLogParams, 'page' | 'limit'>) =>
      exportAuditLogs(params),
  });
}
