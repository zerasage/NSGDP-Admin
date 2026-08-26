import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/organisation-groups';
import type {
  CreateOrganisationGroupPayload,
  UpdateOrganisationGroupPayload,
} from '../api/organisation-groups';

const QUERY_KEY = 'organisation-groups';

export function useOrganisationGroups() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: api.getOrganisationGroups,
  });
}

export function useOrganisationGroup(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => api.getOrganisationGroup(id),
    enabled: !!id,
  });
}

export function useCreateOrganisationGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrganisationGroupPayload) =>
      api.createOrganisationGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateOrganisationGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrganisationGroupPayload }) =>
      api.updateOrganisationGroup(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
    },
  });
}

export function useDeactivateOrganisationGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deactivateOrganisationGroup(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteOrganisationGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteOrganisationGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, organisationId }: { groupId: string; organisationId: string }) =>
      api.addGroupMember(groupId, organisationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.groupId] });
    },
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, organisationId }: { groupId: string; organisationId: string }) =>
      api.removeGroupMember(groupId, organisationId),
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
