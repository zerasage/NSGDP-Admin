import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStaffMembers,
  getStaffInvites,
  createStaffInvite,
  revokeStaffInvite,
  resendStaffInvite,
  revokeStaffStatus,
  type CreateStaffInvitePayload,
} from '../api/staff';

export function useStaffMembers() {
  return useQuery({
    queryKey: ['admin-staff'],
    queryFn: getStaffMembers,
    staleTime: 60 * 1000,
  });
}

export function useStaffInvites() {
  return useQuery({
    queryKey: ['admin-staff-invites'],
    queryFn: getStaffInvites,
    staleTime: 60 * 1000,
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
