import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/development-partner-groups';
import type {
  CreateDevelopmentPartnerGroupPayload,
  UpdateDevelopmentPartnerGroupPayload,
} from '../api/development-partner-groups';

const QUERY_KEY = 'development-partner-groups';

export function useDevelopmentPartnerGroups() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: api.getDevelopmentPartnerGroups,
  });
}

export function useDevelopmentPartnerGroup(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => api.getDevelopmentPartnerGroup(id),
    enabled: !!id,
  });
}

export function useCreateDevelopmentPartnerGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDevelopmentPartnerGroupPayload) =>
      api.createDevelopmentPartnerGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateDevelopmentPartnerGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDevelopmentPartnerGroupPayload }) =>
      api.updateDevelopmentPartnerGroup(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
    },
  });
}

export function useDeactivateDevelopmentPartnerGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deactivateDevelopmentPartnerGroup(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteDevelopmentPartnerGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDevelopmentPartnerGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, developmentPartnerId }: { groupId: string; developmentPartnerId: string }) =>
      api.addGroupMember(groupId, developmentPartnerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.groupId] });
    },
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, developmentPartnerId }: { groupId: string; developmentPartnerId: string }) =>
      api.removeGroupMember(groupId, developmentPartnerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.groupId] });
    },
  });
}

export function useGrantCapability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, capability }: { groupId: string; capability: string }) =>
      api.grantCapability(groupId, capability),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.groupId] });
    },
  });
}

export function useRevokeCapability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, capabilityId }: { groupId: string; capabilityId: string }) =>
      api.revokeCapability(groupId, capabilityId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.groupId] });
    },
  });
}
