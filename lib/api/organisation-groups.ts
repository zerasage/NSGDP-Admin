import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface OrganisationGroup {
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

export interface OrganisationGroupMember {
  id: string;
  organisation_id: string;
  organisation_name: string;
  organisation_acronym: string;
  added_by: string | null;
  joined_at: string;
}

export interface OrganisationGroupCapability {
  id: string;
  group_id: string;
  capability: string;
  granted_by: string;
  created_at: string;
}

export interface OrganisationGroupDetail extends OrganisationGroup {
  members: OrganisationGroupMember[];
  capabilities: OrganisationGroupCapability[];
}

export interface CreateOrganisationGroupPayload {
  name: string;
  description?: string;
}

export interface UpdateOrganisationGroupPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export async function getOrganisationGroups(): Promise<OrganisationGroup[]> {
  const response = await apiClient.get<ApiResponse<OrganisationGroup[]>>('/admin/organisation-groups');
  return response.data.data;
}

export async function getOrganisationGroup(id: string): Promise<OrganisationGroupDetail> {
  const response = await apiClient.get<ApiResponse<OrganisationGroupDetail>>(`/admin/organisation-groups/${id}`);
  return response.data.data;
}

export async function createOrganisationGroup(payload: CreateOrganisationGroupPayload): Promise<OrganisationGroup> {
  const response = await apiClient.post<ApiResponse<OrganisationGroup>>('/admin/organisation-groups', payload);
  return response.data.data;
}

export async function updateOrganisationGroup(id: string, payload: UpdateOrganisationGroupPayload): Promise<OrganisationGroup> {
  const response = await apiClient.patch<ApiResponse<OrganisationGroup>>(`/admin/organisation-groups/${id}`, payload);
  return response.data.data;
}

export async function deactivateOrganisationGroup(id: string): Promise<OrganisationGroup> {
  const response = await apiClient.patch<ApiResponse<OrganisationGroup>>(
    `/admin/organisation-groups/${id}/deactivate`
  );
  return response.data.data;
}

export async function deleteOrganisationGroup(id: string): Promise<void> {
  await apiClient.delete(`/admin/organisation-groups/${id}`);
}

export async function addGroupMember(groupId: string, organisationId: string): Promise<OrganisationGroupMember> {
  const response = await apiClient.post<ApiResponse<OrganisationGroupMember>>(
    `/admin/organisation-groups/${groupId}/members`,
    { organisationId }
  );
  return response.data.data;
}

export async function removeGroupMember(groupId: string, organisationId: string): Promise<void> {
  await apiClient.delete(`/admin/organisation-groups/${groupId}/members/${organisationId}`);
}

export async function grantCapability(
  groupId: string,
  capability: string
): Promise<OrganisationGroupCapability> {
  const response = await apiClient.post<ApiResponse<OrganisationGroupCapability>>(
    `/admin/organisation-groups/${groupId}/capabilities`,
    { capability }
  );
  return response.data.data;
}

export async function revokeCapability(groupId: string, capabilityId: string): Promise<void> {
  await apiClient.delete(`/admin/organisation-groups/${groupId}/capabilities/${capabilityId}`);
}
