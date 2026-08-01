import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPermissionGroups,
  getPermissionGroup,
  getPermissionMatrix,
  createPermissionGroup,
  updatePermissionGroup,
  deactivatePermissionGroup,
  deletePermissionGroup,
  addGroupMember,
  assignGroupMember,
  grantPermission,
  revokePermission,
  type CreatePermissionGroupPayload,
  type UpdatePermissionGroupPayload,
  type PermissionActionKey,
} from '../api/permissions';

export function usePermissionGroups() {
  return useQuery({
    queryKey: ['permission-groups'],
    queryFn: getPermissionGroups,
  });
}

export function usePermissionGroup(id: string | null) {
  return useQuery({
    queryKey: ['permission-group', id],
    queryFn: () => getPermissionGroup(id as string),
    enabled: !!id,
  });
}

export function usePermissionMatrix() {
  return useQuery({
    queryKey: ['permission-matrix'],
    queryFn: getPermissionMatrix,
    staleTime: 60 * 1000,
  });
}

export function useCreatePermissionGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePermissionGroupPayload) => createPermissionGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
    },
  });
}

export function useUpdatePermissionGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePermissionGroupPayload }) =>
      updatePermissionGroup(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      queryClient.invalidateQueries({ queryKey: ['permission-group', variables.id] });
      // isActive toggles (reactivate) flip every member's derived group-access
      // state — keep the staff directory's "Group deactivated" badge in sync.
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
    },
  });
}

export function useDeactivatePermissionGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivatePermissionGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
    },
  });
}

export function useDeletePermissionGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePermissionGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
    },
  });
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) => addGroupMember(groupId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      queryClient.invalidateQueries({ queryKey: ['permission-group', variables.groupId] });
      // Staff picker shows each candidate's current group — keep it in sync
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
    },
  });
}

export function useAssignGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targetGroupId, userId, expectedCurrentGroupId }: {
      targetGroupId: string; userId: string; expectedCurrentGroupId: string | null;
    }) => assignGroupMember(targetGroupId, userId, expectedCurrentGroupId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      queryClient.invalidateQueries({ queryKey: ['permission-group', variables.targetGroupId] });
      if (variables.expectedCurrentGroupId) {
        queryClient.invalidateQueries({ queryKey: ['permission-group', variables.expectedCurrentGroupId] });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
    },
  });
}

export function useGrantPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, action, expiresAt }: { groupId: string; action: PermissionActionKey; expiresAt?: string }) =>
      grantPermission(groupId, action, expiresAt),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      queryClient.invalidateQueries({ queryKey: ['permission-group', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
    },
  });
}

export function useRevokePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, grantId }: { groupId: string; grantId: string }) => revokePermission(groupId, grantId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] });
      queryClient.invalidateQueries({ queryKey: ['permission-group', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
    },
  });
}
