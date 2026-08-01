import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStaffMembers,
  getStaffInvites,
  createStaffInvite,
  revokeStaffInvite,
  resendStaffInvite,
  revokeStaffStatus,
  type CreateStaffInvitePayload,
  type StaffInviteListParams,
  type StaffMemberListParams,
} from '../api/staff';

export function useStaffMembers(params?: StaffMemberListParams) {
  return useQuery({
    queryKey: ['admin-staff', params],
    queryFn: () => getStaffMembers(params),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useStaffInvites(params?: StaffInviteListParams) {
  return useQuery({
    queryKey: ['admin-staff-invites', params],
    queryFn: () => getStaffInvites(params),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateStaffInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffInvitePayload) => createStaffInvite(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-invites'] });
    },
  });
}

export function useRevokeStaffInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => revokeStaffInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-invites'] });
    },
  });
}

export function useResendStaffInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => resendStaffInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-invites'] });
    },
  });
}

export function useRevokeStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => revokeStaffStatus(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
    },
  });
}
