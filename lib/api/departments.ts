import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface Department {
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

export interface DepartmentMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  added_by: string | null;
  joined_at: string;
}

export interface DepartmentDetail extends Department {
  members: DepartmentMember[];
}

export interface DepartmentStats {
  totalDepartments: number;
  activeDepartments: number;
  /** Distinct staff across all departments — a staff member in 2+ departments is counted once. */
  uniqueMembers: number;
  totalStaff: number;
  staffWithoutDepartment: number;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

/** Super admin only — the full department list. */
export async function getDepartments(): Promise<Department[]> {
  const response = await apiClient.get<ApiResponse<Department[]>>('/admin/departments');
  return response.data.data;
}

/** Departments the current user belongs to — used by non-super-admin viewers. */
export async function getMyDepartments(): Promise<Department[]> {
  const response = await apiClient.get<ApiResponse<Department[]>>('/admin/departments/me');
  return response.data.data;
}

/** Super admin only — agency-wide, deduped department stats. */
export async function getDepartmentStats(): Promise<DepartmentStats> {
  const response = await apiClient.get<ApiResponse<DepartmentStats>>('/admin/departments/stats');
  return response.data.data;
}

export async function getDepartment(id: string): Promise<DepartmentDetail> {
  const response = await apiClient.get<ApiResponse<DepartmentDetail>>(`/admin/departments/${id}`);
  return response.data.data;
}

export async function createDepartment(payload: CreateDepartmentPayload): Promise<Department> {
  const response = await apiClient.post<ApiResponse<Department>>('/admin/departments', payload);
  return response.data.data;
}

export async function updateDepartment(id: string, payload: UpdateDepartmentPayload): Promise<Department> {
  const response = await apiClient.patch<ApiResponse<Department>>(`/admin/departments/${id}`, payload);
  return response.data.data;
}

export async function deactivateDepartment(id: string): Promise<Department> {
  const response = await apiClient.patch<ApiResponse<Department>>(`/admin/departments/${id}/deactivate`);
  return response.data.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`/admin/departments/${id}`);
}

export async function addDepartmentMember(departmentId: string, userId: string): Promise<DepartmentMember> {
  const response = await apiClient.post<ApiResponse<DepartmentMember>>(
    `/admin/departments/${departmentId}/members`,
    { userId },
  );
  return response.data.data;
}

export async function removeDepartmentMember(departmentId: string, userId: string): Promise<void> {
  await apiClient.delete(`/admin/departments/${departmentId}/members/${userId}`);
}
