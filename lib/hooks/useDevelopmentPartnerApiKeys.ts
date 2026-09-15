import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDevelopmentPartnerApiKeys,
  createDevelopmentPartnerApiKey,
  revokeDevelopmentPartnerApiKey,
} from '../api/development-partner-api-keys';

export function useDevelopmentPartnerApiKeys(developmentPartnerId: string | undefined) {
  return useQuery({
    queryKey: ['development-partner-api-keys', developmentPartnerId],
    queryFn: () => getDevelopmentPartnerApiKeys(developmentPartnerId as string),
    enabled: !!developmentPartnerId,
  });
}

export function useCreateDevelopmentPartnerApiKey(developmentPartnerId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      createDevelopmentPartnerApiKey(developmentPartnerId as string, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['development-partner-api-keys', developmentPartnerId],
      });
    },
  });
}

export function useRevokeDevelopmentPartnerApiKey(developmentPartnerId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) =>
      revokeDevelopmentPartnerApiKey(developmentPartnerId as string, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['development-partner-api-keys', developmentPartnerId],
      });
    },
  });
}
