import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrganisationApiKeys,
  createOrganisationApiKey,
  revokeOrganisationApiKey,
} from '../api/organisation-api-keys';

export function useOrganisationApiKeys(organisationId: string | undefined) {
  return useQuery({
    queryKey: ['organisation-api-keys', organisationId],
    queryFn: () => getOrganisationApiKeys(organisationId as string),
    enabled: !!organisationId,
  });
}

export function useCreateOrganisationApiKey(organisationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      createOrganisationApiKey(organisationId as string, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organisation-api-keys', organisationId],
      });
    },
  });
}

export function useRevokeOrganisationApiKey(organisationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) =>
      revokeOrganisationApiKey(organisationId as string, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organisation-api-keys', organisationId],
      });
    },
  });
}
