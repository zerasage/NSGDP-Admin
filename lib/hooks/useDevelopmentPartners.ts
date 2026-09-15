import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDevelopmentPartners,
  getDevelopmentPartnerBySlug,
  createDevelopmentPartner,
  updateDevelopmentPartner,
  toggleDevelopmentPartnerStatus,
  deleteDevelopmentPartner,
  uploadDevelopmentPartnerAgreement,
  type CreateDevelopmentPartnerPayload,
  type GetDevelopmentPartnersParams,
  type UpdateDevelopmentPartnerPayload,
} from '../api/development-partners';

/**
 * Hook to fetch all development partners with pagination
 */
export function useDevelopmentPartners(
  page: number = 1,
  limit: number = 50,
  scope?: 'partners' | 'platform-owner',
  filters?: Pick<GetDevelopmentPartnersParams, 'search' | 'type' | 'status'>
) {
  return useQuery({
    queryKey: ['development-partners', page, limit, scope, filters],
    queryFn: () => getDevelopmentPartners({ page, limit, scope, ...filters }),
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000, // 10 minutes - development partners don't change often
  });
}

/**
 * Hook to fetch a single development partner by slug with datasets
 */
export function useDevelopmentPartnerBySlug(slug: string) {
  return useQuery({
    queryKey: ['development-partner', slug],
    queryFn: () => getDevelopmentPartnerBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
/**
 * Create a new development partner (Super Admin only)
 */
export function useCreateDevelopmentPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDevelopmentPartnerPayload) => createDevelopmentPartner(data),
    onSuccess: () => {
      // Invalidate development partners list to refetch
      queryClient.invalidateQueries({
        queryKey: ['development-partners'],
      });
    },
  });
}

/**
 * Update a development partner's details
 */
export function useUpdateDevelopmentPartner(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDevelopmentPartnerPayload }) =>
      updateDevelopmentPartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-partner', slug] });
      queryClient.invalidateQueries({ queryKey: ['development-partners'] });
    },
  });
}

/**
 * Enable/disable a development partner (Super Admin only)
 */
export function useToggleDevelopmentPartnerStatus(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleDevelopmentPartnerStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-partner', slug] });
      queryClient.invalidateQueries({ queryKey: ['development-partners'] });
    },
  });
}

/**
 * Soft delete a development partner and everything it owns — members, datasets,
 * pending invites (Super Admin only)
 */
export function useDeleteDevelopmentPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDevelopmentPartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/**
 * Upload or replace a development partner's signed data-sharing agreement (Super Admin only)
 */
export function useUploadAgreement(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, file, signedAt }: { orgId: string; file: File; signedAt?: string }) =>
      uploadDevelopmentPartnerAgreement(orgId, file, signedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-partner', slug] });
    },
  });
}
