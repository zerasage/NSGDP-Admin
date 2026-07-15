import { apiClient } from './client';
import type { PaginatedResponse } from '../types/common';
import type { Dataset as BackendDataset } from './datasets';

// Use the Dataset type from datasets.ts for the review queue
type Dataset = BackendDataset;

// Backend wraps all responses in this structure
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'viewer' | 'contributor' | 'data_manager' | 'admin' | 'super_admin';
  status: 'active' | 'suspended' | 'archived';
  organisation_id: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserStats {
  total: number;
  byStatus: Record<string, number>;
  byRole: Record<string, number>;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  organisationId?: string;
}

export interface UpdateUserRoleDto {
  role: 'viewer' | 'contributor' | 'data_manager' | 'admin' | 'super_admin';
}

export interface UpdateUserStatusDto {
  status: 'active' | 'suspended' | 'archived';
}

export interface ReviewQueueParams {
  page?: number;
  limit?: number;
  status?: string;
  organisation?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ApproveDatasetDto {
  comment?: string;
}

export interface RejectDatasetDto {
  reason: string;
}

export interface ReviseDatasetDto {
  comment: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  created_at: string;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get all users with filters and pagination
 */
export async function getUsers(
  params?: UserListParams
): Promise<PaginatedResponse<AdminUser>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<AdminUser>>>(
    '/admin/users',
    { params: params as Record<string, unknown> }
  );
  return response.data.data;
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  const response = await apiClient.get<ApiResponse<UserStats>>(
    '/admin/users/stats'
  );
  return response.data.data;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<AdminUser> {
  const response = await apiClient.get<ApiResponse<AdminUser>>(
    `/admin/users/${userId}`
  );
  return response.data.data;
}

/**
 * Update user role (super_admin only)
 */
export async function updateUserRole(
  userId: string,
  data: UpdateUserRoleDto
): Promise<AdminUser> {
  const response = await apiClient.patch<ApiResponse<AdminUser>>(
    `/admin/users/${userId}/role`,
    data
  );
  return response.data.data;
}

/**
 * Update user status (activate, suspend, archive)
 */
export async function updateUserStatus(
  userId: string,
  data: UpdateUserStatusDto
): Promise<AdminUser> {
  const response = await apiClient.patch<ApiResponse<AdminUser>>(
    `/admin/users/${userId}/status`,
    data
  );
  return response.data.data;
}

/**
 * Get dataset review queue
 */
export async function getReviewQueue(
  params?: ReviewQueueParams
): Promise<{ data: Dataset[]; total: number; page: number; limit: number }> {
  const response = await apiClient.get<ApiResponse<{ data: Dataset[]; total: number; page: number; limit: number }>>(
    '/admin/review-queue',
    { params: params as Record<string, unknown> }
  );
  return response.data.data;
}

/**
 * Approve a dataset
 */
export async function approveDataset(
  datasetId: string,
  data?: ApproveDatasetDto
): Promise<Dataset> {
  const response = await apiClient.post<ApiResponse<Dataset>>(
    `/admin/datasets/${datasetId}/approve`,
    data || {}
  );
  return response.data.data;
}

/**
 * Reject a dataset
 */
export async function rejectDataset(
  datasetId: string,
  data: RejectDatasetDto
): Promise<Dataset> {
  const response = await apiClient.post<ApiResponse<Dataset>>(
    `/admin/datasets/${datasetId}/reject`,
    data
  );
  return response.data.data;
}

/**
 * Request dataset revision
 */
export async function requestRevision(
  datasetId: string,
  data: ReviseDatasetDto
): Promise<Dataset> {
  const response = await apiClient.post<ApiResponse<Dataset>>(
    `/admin/datasets/${datasetId}/revise`,
    data
  );
  return response.data.data;
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
  params?: AuditLogParams
): Promise<PaginatedResponse<AuditLog>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<AuditLog>>>(
    '/admin/audit-logs',
    { params: params as Record<string, unknown> }
  );
  return response.data.data;
}

/**
 * Export audit logs as CSV
 */
export async function exportAuditLogs(
  params?: Omit<AuditLogParams, 'page' | 'limit'>
): Promise<Blob> {
  // Note: Blob response type handling would need to be implemented in apiClient
  // For now, cast the response
  const response = await apiClient.get<Blob>('/admin/audit-logs/export', {
    params: params as Record<string, unknown>,
  });
  return response.data;
}
