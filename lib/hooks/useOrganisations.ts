import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrganisations,
  getOrganisationBySlug,
  createOrganisation,
  updateOrganisation,
  toggleOrganisationStatus,
  uploadOrganisationAgreement,
  type CreateOrganisationPayload,
  type UpdateOrganisationPayload,
} from '../api/organisations';

/**
 * Hook to fetch all organisations with pagination
 */
export function useOrganisations(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: ['organisations', page, limit],
    queryFn: () => getOrganisations({ page, limit }),
    staleTime: 10 * 60 * 1000, // 10 minutes - organisations don't change often
  });
}

/**
 * Hook to fetch a single organisation by slug with datasets
 */
export function useOrganisationBySlug(slug: string) {
  return useQuery({
    queryKey: ['organisation', slug],
    queryFn: () => getOrganisationBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
/**
 * Create a new organisation (Super Admin only)
 */
export function useCreateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganisationPayload) => createOrganisation(data),
    onSuccess: () => {
      // Invalidate organisations list to refetch
      queryClient.invalidateQueries({
        queryKey: ['organisations'],
      });
    },
  });
}

/**
 * Update an organisation's details
 */
export function useUpdateOrganisation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganisationPayload }) =>
      updateOrganisation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisation', slug] });
      queryClient.invalidateQueries({ queryKey: ['organisations'] });
    },
  });
}

/**
 * Enable/disable an organisation (Super Admin only)
 */
export function useToggleOrganisationStatus(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleOrganisationStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisation', slug] });
      queryClient.invalidateQueries({ queryKey: ['organisations'] });
    },
  });
}

/**
 * Upload or replace an organisation's signed data-sharing agreement (Super Admin only)
 */
export function useUploadAgreement(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, file, signedAt }: { orgId: string; file: File; signedAt?: string }) =>
      uploadOrganisationAgreement(orgId, file, signedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisation', slug] });
    },
  });
}
