import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';

export interface GroupMemberSummary {
  id: string;
  slug: string;
  title: string;
}

export interface AdminGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  dataset_ids: string[] | null;
  document_ids: string[] | null;
  is_featured: boolean;
  curator_id: string;
  created_at: string;
  updated_at: string;
}

export interface AdminGroupDetail extends AdminGroup {
  datasets: GroupMemberSummary[];
  documents: GroupMemberSummary[];
}

export interface GetGroupsParams {
  page?: number;
  limit?: number;
  search?: string;
  featured?: boolean;
}

export interface CreateGroupPayload {
  name: string;
  description: string;
  isFeatured?: boolean;
}

export type UpdateGroupPayload = Partial<CreateGroupPayload>;

interface GroupListApiPayload {
  data: AdminGroup[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function getGroups(
  params?: GetGroupsParams
): Promise<PaginatedResponse<AdminGroup>> {
  const response = await apiClient.get<ApiResponse<GroupListApiPayload>>('/groups', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      search: params?.search,
      featured: params?.featured,
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

export async function getGroupBySlug(slug: string): Promise<AdminGroupDetail> {
  const response = await apiClient.get<ApiResponse<AdminGroupDetail>>(`/groups/${slug}`);
  return response.data.data;
}

export async function createGroup(data: CreateGroupPayload): Promise<AdminGroup> {
  const response = await apiClient.post<ApiResponse<AdminGroup>>('/groups', data);
  return response.data.data;
}

export async function updateGroup(
  slug: string,
  data: UpdateGroupPayload
): Promise<AdminGroup> {
  const response = await apiClient.patch<ApiResponse<AdminGroup>>(`/groups/${slug}`, data);
  return response.data.data;
}

export async function deleteGroup(slug: string): Promise<void> {
  await apiClient.delete(`/groups/${slug}`);
}

export async function addDatasetToGroup(
  slug: string,
  datasetId: string
): Promise<AdminGroup> {
  const response = await apiClient.post<ApiResponse<AdminGroup>>(
    `/groups/${slug}/datasets/${datasetId}`
  );
  return response.data.data;
}

export async function removeDatasetFromGroup(
  slug: string,
  datasetId: string
): Promise<AdminGroup> {
  const response = await apiClient.delete<ApiResponse<AdminGroup>>(
    `/groups/${slug}/datasets/${datasetId}`
  );
  return response.data.data;
}
