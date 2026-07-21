import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

// Mirrors nsgdp-backend src/modules/admin/constants/permission-actions.ts
export type PermissionActionKey =
  | 'approve:datasets'
  | 'publish:datasets'
  | 'archive:datasets'
  | 'manage:users'
  | 'view:restricted'
  | 'download:restricted'
  | 'create:programs'
  | 'edit:programs'
  | 'delete:programs'
  | 'upload:programs';

export interface PermissionGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  member_count: number;
  grant_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionGroupMember {
  id: string;
  user_id: string;
  added_by: string | null;
  joined_at: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface PermissionGrant {
  id: string;
  group_id: string;
  action: string;
  resource_type: string;
  permission_key: PermissionActionKey | null;
  is_granted: boolean;
  expires_at: string | null;
  granted_by: string;
  created_at: string;
}

export interface PermissionGroupDetail extends PermissionGroup {
  members: PermissionGroupMember[];
  grants: PermissionGrant[];
}

export interface PermissionMatrix {
  actions: Array<{ key: PermissionActionKey; minimumRole: string; resourceType: string; action: string }>;
  roles: Array<{ role: string; actions: Record<PermissionActionKey, boolean> }>;
  delegations: Array<{ id: string; name: string; slug: string; actions: PermissionActionKey[] }>;
}

export interface CreatePermissionGroupPayload {
  name: string;
  description?: string;
  initialActions?: PermissionActionKey[];
}

export interface UpdatePermissionGroupPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export async function getPermissionGroups(): Promise<PermissionGroup[]> {
  const response = await apiClient.get<ApiResponse<PermissionGroup[]>>('/admin/permission-groups');
  return response.data.data;
}

export async function getPermissionGroup(id: string): Promise<PermissionGroupDetail> {
  const response = await apiClient.get<ApiResponse<PermissionGroupDetail>>(`/admin/permission-groups/${id}`);
  return response.data.data;
}

export async function getPermissionMatrix(): Promise<PermissionMatrix> {
  const response = await apiClient.get<ApiResponse<PermissionMatrix>>('/admin/permission-groups/matrix');
  return response.data.data;
}

export async function createPermissionGroup(payload: CreatePermissionGroupPayload): Promise<PermissionGroup> {
  const response = await apiClient.post<ApiResponse<PermissionGroup>>('/admin/permission-groups', payload);
  return response.data.data;
}

export async function updatePermissionGroup(id: string, payload: UpdatePermissionGroupPayload): Promise<PermissionGroup> {
  const response = await apiClient.patch<ApiResponse<PermissionGroup>>(`/admin/permission-groups/${id}`, payload);
  return response.data.data;
}

export async function deletePermissionGroup(id: string): Promise<void> {
  await apiClient.delete(`/admin/permission-groups/${id}`);
}

export async function addGroupMember(groupId: string, userId: string): Promise<PermissionGroupMember> {
  const response = await apiClient.post<ApiResponse<PermissionGroupMember>>(
    `/admin/permission-groups/${groupId}/members`,
    { userId }
  );
  return response.data.data;
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await apiClient.delete(`/admin/permission-groups/${groupId}/members/${userId}`);
}

export async function grantPermission(
  groupId: string,
  action: PermissionActionKey,
  expiresAt?: string
): Promise<PermissionGrant> {
  const response = await apiClient.post<ApiResponse<PermissionGrant>>(
    `/admin/permission-groups/${groupId}/grants`,
    { action, expiresAt }
  );
  return response.data.data;
}

export async function revokePermission(groupId: string, grantId: string): Promise<void> {
  await apiClient.delete(`/admin/permission-groups/${groupId}/grants/${grantId}`);
}
