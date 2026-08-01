import { apiClient, apiUpload } from './client';
import type { PaginatedResponse } from '../types/common';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export type OrganisationType =
  | 'government'
  | 'ngo'
  | 'private'
  | 'international'
  | 'academic'
  | 'community'
  | 'healthcare'
  | 'other';

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: OrganisationType;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url?: string;
  acronym?: string;
  is_active: boolean;
  is_platform_owner: boolean;
  created_at: string;
  updated_at: string;
  agreement_file_path?: string | null;
  agreement_file_name?: string | null;
  agreement_signed_at?: string | null;
  agreement_uploaded_by?: string | null;
  agreement_uploaded_at?: string | null;
  /** Only present on GET /admin/organisations (list), not the single-org endpoint */
  dataset_count?: number;
}

export interface OrganisationWithDatasets {
  organisation: Organisation;
  datasets: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    format: string;
    visibility: string;
    created_at: string;
    downloadCount?: number;
  }>;
}

export interface GetOrganisationsParams {
  page?: number;
  limit?: number;
  scope?: 'partners' | 'platform-owner';
  search?: string;
  type?: OrganisationType;
  status?: 'active' | 'inactive';
}

interface OrganisationListResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all organisations with pagination (admin view — includes inactive
 * organisations; the public `/organisations` endpoint filters those out,
 * which is wrong for the admin app: it made deactivated orgs permanently
 * unreachable from this list).
 */
export async function getOrganisations(
  params?: GetOrganisationsParams
): Promise<PaginatedResponse<Organisation>> {
  const response = await apiClient.get<ApiResponse<OrganisationListResponse<Organisation>>>('/admin/organisations', {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 20,
      scope: params?.scope,
      search: params?.search || undefined,
      type: params?.type,
      status: params?.status,
    },
  });
  const result = response.data.data;
  return {
    data: result.data,
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
    totalPages: result.meta.totalPages,
  };
}

/**
 * Get organisation by slug with datasets (admin view - shows all datasets)
 */
export async function getOrganisationBySlug(
  slug: string
): Promise<OrganisationWithDatasets> {
  const response = await apiClient.get<ApiResponse<OrganisationWithDatasets>>(`/admin/organisations/${slug}`);
  return response.data.data;
}

export interface CreateOrganisationPayload {
  name: string;
  acronym?: string;
  description?: string;
  type: OrganisationType;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

/**
 * Create a new organisation (Super Admin only)
 */
export async function createOrganisation(
  payload: CreateOrganisationPayload
): Promise<Organisation> {
  const response = await apiClient.post<ApiResponse<Organisation>>(
    '/organisations',
    payload
  );
  return response.data.data;
}

export interface UpdateOrganisationPayload {
  name?: string;
  acronym?: string;
  description?: string;
  type?: OrganisationType;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

/**
 * Update an organisation's details (Super Admin, or Admin of their own org)
 */
export async function updateOrganisation(
  id: string,
  payload: UpdateOrganisationPayload
): Promise<Organisation> {
  const response = await apiClient.patch<ApiResponse<Organisation>>(
    `/organisations/${id}`,
    payload
  );
  return response.data.data;
}

/**
 * Enable/disable an organisation (Super Admin only)
 */
export async function toggleOrganisationStatus(
  id: string,
  isActive: boolean
): Promise<Organisation> {
  const response = await apiClient.patch<ApiResponse<Organisation>>(
    `/organisations/${id}/status`,
    { isActive }
  );
  return response.data.data;
}

export interface DeleteOrganisationResult {
  message: string;
  membersRemoved: number;
  datasetsRemoved: number;
  invitesRevoked: number;
}

/**
 * Soft delete an organisation and everything it owns — members, datasets,
 * pending invites (Super Admin only)
 */
export async function deleteOrganisation(id: string): Promise<DeleteOrganisationResult> {
  const response = await apiClient.delete<ApiResponse<DeleteOrganisationResult>>(
    `/organisations/${id}`
  );
  return response.data.data;
}

export interface OrganisationAgreement {
  agreement_file_path: string | null;
  agreement_file_name: string | null;
  agreement_signed_at: string | null;
  agreement_uploaded_by: string | null;
  agreement_uploaded_at: string | null;
}

/**
 * Upload or replace an organisation's signed data-sharing agreement (Super Admin only)
 */
export async function uploadOrganisationAgreement(
  orgId: string,
  file: File,
  signedAt?: string
): Promise<OrganisationAgreement> {
  const formData = new FormData();
  formData.append('file', file);
  if (signedAt) formData.append('signedAt', signedAt);

  const response = await apiUpload<ApiResponse<OrganisationAgreement>>(
    `/organisations/${orgId}/agreement`,
    formData
  );
  return response.data;
}

/**
 * Get a temporary download URL for an organisation's agreement document (Super Admin only)
 */
export async function getOrganisationAgreementUrl(
  orgId: string
): Promise<{ url: string; fileName: string }> {
  const response = await apiClient.get<ApiResponse<{ url: string; fileName: string }>>(
    `/organisations/${orgId}/agreement`
  );
  return response.data.data;
}
