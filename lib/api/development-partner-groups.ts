import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface DevelopmentPartnerGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  member_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentPartnerGroupMember {
  id: string;
  development_partner_id: string;
  development_partner_name: string;
  development_partner_acronym: string;
  added_by: string | null;
  joined_at: string;
}

export interface DevelopmentPartnerGroupCapability {
  id: string;
  group_id: string;
  capability: string;
  granted_by: string;
  created_at: string;
}

export interface DevelopmentPartnerGroupDetail extends DevelopmentPartnerGroup {
  members: DevelopmentPartnerGroupMember[];
  capabilities: DevelopmentPartnerGroupCapability[];
}

export interface CreateDevelopmentPartnerGroupPayload {
  name: string;
  description?: string;
}

export interface UpdateDevelopmentPartnerGroupPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export async function getDevelopmentPartnerGroups(): Promise<DevelopmentPartnerGroup[]> {
  const response = await apiClient.get<ApiResponse<DevelopmentPartnerGroup[]>>('/admin/development-partner-groups');
  return response.data.data;
}

export async function getDevelopmentPartnerGroup(id: string): Promise<DevelopmentPartnerGroupDetail> {
  const response = await apiClient.get<ApiResponse<DevelopmentPartnerGroupDetail>>(`/admin/development-partner-groups/${id}`);
  return response.data.data;
}

export async function createDevelopmentPartnerGroup(payload: CreateDevelopmentPartnerGroupPayload): Promise<DevelopmentPartnerGroup> {
  const response = await apiClient.post<ApiResponse<DevelopmentPartnerGroup>>('/admin/development-partner-groups', payload);
  return response.data.data;
}

export async function updateDevelopmentPartnerGroup(id: string, payload: UpdateDevelopmentPartnerGroupPayload): Promise<DevelopmentPartnerGroup> {
  const response = await apiClient.patch<ApiResponse<DevelopmentPartnerGroup>>(`/admin/development-partner-groups/${id}`, payload);
  return response.data.data;
}

export async function deactivateDevelopmentPartnerGroup(id: string): Promise<DevelopmentPartnerGroup> {
  const response = await apiClient.patch<ApiResponse<DevelopmentPartnerGroup>>(
    `/admin/development-partner-groups/${id}/deactivate`
  );
  return response.data.data;
}

export async function deleteDevelopmentPartnerGroup(id: string): Promise<void> {
  await apiClient.delete(`/admin/development-partner-groups/${id}`);
}

export async function addGroupMember(groupId: string, developmentPartnerId: string): Promise<DevelopmentPartnerGroupMember> {
  const response = await apiClient.post<ApiResponse<DevelopmentPartnerGroupMember>>(
    `/admin/development-partner-groups/${groupId}/members`,
    { developmentPartnerId }
  );
  return response.data.data;
}

export async function removeGroupMember(groupId: string, developmentPartnerId: string): Promise<void> {
  await apiClient.delete(`/admin/development-partner-groups/${groupId}/members/${developmentPartnerId}`);
}

export async function grantCapability(
  groupId: string,
  capability: string
): Promise<DevelopmentPartnerGroupCapability> {
  const response = await apiClient.post<ApiResponse<DevelopmentPartnerGroupCapability>>(
    `/admin/development-partner-groups/${groupId}/capabilities`,
    { capability }
  );
  return response.data.data;
}

export async function revokeCapability(groupId: string, capabilityId: string): Promise<void> {
  await apiClient.delete(`/admin/development-partner-groups/${groupId}/capabilities/${capabilityId}`);
}
