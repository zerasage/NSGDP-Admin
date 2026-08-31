import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';

export type ProgrammeType =
  | 'campaign'
  | 'surveillance'
  | 'screening'
  | 'training'
  | 'infrastructure'
  | 'research'
  | 'other';

export type ProgrammeStatus = 'active' | 'completed' | 'suspended' | 'archived';

export type ProgrammeProgressMode =
  | 'lga_coverage'
  | 'outcome_metric'
  | 'combined';

export interface AdminProgramme {
  id: string;
  name: string;
  slug: string;
  description: string;
  code: string | null;
  type: ProgrammeType | null;
  status: ProgrammeStatus;
  start_date: string | null;
  end_date: string | null;
  organisation_id: string | null;
  manager_id: string | null;
  target_lgas: string[] | null;
  covered_lgas: string[] | null;
  objectives: string[] | null;
  key_indicators: Record<string, unknown>[] | null;
  dataset_count: number;
  campaign_count: number;
  progress_mode: ProgrammeProgressMode | null;
  primary_metric: string | null;
  target_count: number | null;
  reach_count: number | null;
  lgas_covered_count: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface GetProgrammesParams {
  page?: number;
  limit?: number;
  status?: ProgrammeStatus;
  type?: ProgrammeType;
  organisationId?: string;
  lga?: string;
  q?: string;
  sort?: 'recent' | 'alphabetical';
}

export interface CreateProgrammePayload {
  name: string;
  description: string;
  type?: ProgrammeType;
  code?: string;
  organisationId?: string;
  managerId?: string;
  targetLgas?: string[];
  coveredLgas?: string[];
  startDate?: string;
  endDate?: string;
  objectives?: string[];
  progressMode?: ProgrammeProgressMode;
  primaryMetric?: string;
  targetCount?: number;
  reachCount?: number;
  lgasCoveredCount?: number;
}

export interface UpdateProgrammePayload extends Partial<CreateProgrammePayload> {
  status?: ProgrammeStatus;
}

interface ProgrammeListApiPayload {
  data: AdminProgramme[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function getProgrammes(
  params?: GetProgrammesParams
): Promise<PaginatedResponse<AdminProgramme>> {
  const response = await apiClient.get<ApiResponse<ProgrammeListApiPayload>>('/programs', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      status: params?.status,
      type: params?.type,
      organisationId: params?.organisationId,
      lga: params?.lga,
      q: params?.q,
      sort: params?.sort,
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

export async function getProgrammeBySlug(slug: string): Promise<AdminProgramme> {
  const response = await apiClient.get<ApiResponse<AdminProgramme>>(`/programs/${slug}`);
  return response.data.data;
}

export async function createProgramme(data: CreateProgrammePayload): Promise<AdminProgramme> {
  const response = await apiClient.post<ApiResponse<AdminProgramme>>('/programs', data);
  return response.data.data;
}

export async function updateProgramme(
  slug: string,
  data: UpdateProgrammePayload
): Promise<AdminProgramme> {
  const response = await apiClient.patch<ApiResponse<AdminProgramme>>(`/programs/${slug}`, data);
  return response.data.data;
}

export async function archiveProgramme(slug: string): Promise<void> {
  await apiClient.delete(`/programs/${slug}`);
}
