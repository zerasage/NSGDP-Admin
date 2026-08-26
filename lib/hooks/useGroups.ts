import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGroups,
  getGroupBySlug,
  createGroup,
  updateGroup,
  deleteGroup,
  addDatasetToGroup,
  removeDatasetFromGroup,
  type CreateGroupPayload,
  type UpdateGroupPayload,
  type GetGroupsParams,
} from '../api/groups';

export function useGroups(params?: GetGroupsParams) {
  return useQuery({
    queryKey: ['groups', params],
    queryFn: () => getGroups(params),
    placeholderData: keepPreviousData,
  });
}

export function useGroupBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['group', slug],
    queryFn: () => getGroupBySlug(slug as string),
    enabled: !!slug,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupPayload) => createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateGroupPayload }) =>
      updateGroup(slug, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', variables.slug] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => deleteGroup(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useAddDatasetToGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, datasetId }: { slug: string; datasetId: string }) =>
      addDatasetToGroup(slug, datasetId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useRemoveDatasetFromGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, datasetId }: { slug: string; datasetId: string }) =>
      removeDatasetFromGroup(slug, datasetId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
