import { apiClient, apiUpload } from './client';
import type { PaginatedResponse } from '../types/common';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export type DevelopmentPartnerType =
  | 'government'
  | 'ngo'
  | 'private'
  | 'international'
  | 'academic'
  | 'community'
  | 'healthcare'
  | 'other';

export interface DevelopmentPartner {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: DevelopmentPartnerType;
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
  /** Only present on GET /admin/development-partners (list), not the single-partner endpoint */
  dataset_count?: number;
}

export interface DevelopmentPartnerWithDatasets {
  developmentPartner: DevelopmentPartner;
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

export interface GetDevelopmentPartnersParams {
  page?: number;
  limit?: number;
  scope?: 'partners' | 'platform-owner';
  search?: string;
  type?: DevelopmentPartnerType;
  status?: 'active' | 'inactive';
}

interface DevelopmentPartnerListResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all development partners with pagination (admin view — includes inactive
 * development partners; the public `/development-partners` endpoint filters those out,
 * which is wrong for the admin app: it made deactivated partners permanently
 * unreachable from this list).
 */
export async function getDevelopmentPartners(
  params?: GetDevelopmentPartnersParams
): Promise<PaginatedResponse<DevelopmentPartner>> {
  const response = await apiClient.get<ApiResponse<DevelopmentPartnerListResponse<DevelopmentPartner>>>('/admin/development-partners', {
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
 * Get development partner by slug with datasets (admin view - shows all datasets)
 */
export async function getDevelopmentPartnerBySlug(
  slug: string
): Promise<DevelopmentPartnerWithDatasets> {
  const response = await apiClient.get<ApiResponse<DevelopmentPartnerWithDatasets>>(`/admin/development-partners/${slug}`);
  return response.data.data;
}

export interface CreateDevelopmentPartnerPayload {
  name: string;
  acronym?: string;
  description?: string;
  type: DevelopmentPartnerType;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

/**
 * Create a new development partner (Super Admin only)
 */
export async function createDevelopmentPartner(
  payload: CreateDevelopmentPartnerPayload
): Promise<DevelopmentPartner> {
  const response = await apiClient.post<ApiResponse<DevelopmentPartner>>(
    '/development-partners',
    payload
  );
  return response.data.data;
}

export interface UpdateDevelopmentPartnerPayload {
  name?: string;
  acronym?: string;
  description?: string;
  type?: DevelopmentPartnerType;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

/**
 * Update a development partner's details (Super Admin, or Admin of their own partner)
 */
export async function updateDevelopmentPartner(
  id: string,
  payload: UpdateDevelopmentPartnerPayload
): Promise<DevelopmentPartner> {
  const response = await apiClient.patch<ApiResponse<DevelopmentPartner>>(
    `/development-partners/${id}`,
    payload
  );
  return response.data.data;
}

/**
 * Enable/disable a development partner (Super Admin only)
 */
export async function toggleDevelopmentPartnerStatus(
  id: string,
  isActive: boolean
): Promise<DevelopmentPartner> {
  const response = await apiClient.patch<ApiResponse<DevelopmentPartner>>(
    `/development-partners/${id}/status`,
    { isActive }
  );
  return response.data.data;
}

export interface DeleteDevelopmentPartnerResult {
  message: string;
  membersRemoved: number;
  datasetsRemoved: number;
  invitesRevoked: number;
}

/**
 * Soft delete a development partner and everything it owns — members, datasets,
 * pending invites (Super Admin only)
 */
export async function deleteDevelopmentPartner(id: string): Promise<DeleteDevelopmentPartnerResult> {
  const response = await apiClient.delete<ApiResponse<DeleteDevelopmentPartnerResult>>(
    `/development-partners/${id}`
  );
  return response.data.data;
}

export interface DevelopmentPartnerAgreement {
  agreement_file_path: string | null;
  agreement_file_name: string | null;
  agreement_signed_at: string | null;
  agreement_uploaded_by: string | null;
  agreement_uploaded_at: string | null;
}

/**
 * Upload or replace a development partner's signed data-sharing agreement (Super Admin only)
 */
export async function uploadDevelopmentPartnerAgreement(
  orgId: string,
  file: File,
  signedAt?: string
): Promise<DevelopmentPartnerAgreement> {
  const formData = new FormData();
  formData.append('file', file);
  if (signedAt) formData.append('signedAt', signedAt);

  const response = await apiUpload<ApiResponse<DevelopmentPartnerAgreement>>(
    `/development-partners/${orgId}/agreement`,
    formData
  );
  return response.data;
}

/**
 * Get a temporary download URL for a development partner's agreement document (Super Admin only)
 */
export async function getDevelopmentPartnerAgreementUrl(
  orgId: string
): Promise<{ url: string; fileName: string }> {
  const response = await apiClient.get<ApiResponse<{ url: string; fileName: string }>>(
    `/development-partners/${orgId}/agreement`
  );
  return response.data.data;
}
