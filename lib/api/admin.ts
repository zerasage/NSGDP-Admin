import { apiClient } from './client';
import type { PaginatedResponse } from '../types/common';
import type { Dataset as BackendDataset } from './datasets';
import type { UserRole } from '@/types';

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
  first_name: string;
  last_name: string;
  role: UserRole;
  status: 'pending' | 'active' | 'suspended' | 'archived';
  organisation_id: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  phone_number?: string | null;
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
  role: UserRole;
}

export interface UpdateUserStatusDto {
  status: AdminUser['status'];
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

// Mirrors nsgdp-backend AuditAction enum (src/modules/admin/entities/audit-log.entity.ts)
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'download'
  | 'upload'
  | 'export';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
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
 * Update user status (activate, suspend, archive) — super_admin/admin only,
 * no delegated-permission path. Use deactivateUserDelegated for the
 * staff-reachable suspend action.
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
 * Suspend a user account via the delegatable endpoint — reachable by
 * super_admin or staff holding the deactivate:users permission. One-directional
 * (always suspends); there is no delegated "reactivate" or "approve" action.
 */
export async function deactivateUserDelegated(
  userId: string,
  reason?: string
): Promise<void> {
  await apiClient.post<ApiResponse<{ message: string }>>(
    `/admin/users/${userId}/deactivate`,
    reason ? { reason } : {}
  );
}

/**
 * Soft delete a user account (admin only)
 */
export async function removeUser(userId: string): Promise<void> {
  await apiClient.delete(`/admin/users/${userId}`);
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
  datasetSlug: string,
  data: ReviseDatasetDto
): Promise<Dataset> {
  const response = await apiClient.post<ApiResponse<Dataset>>(
    `/admin/datasets/${datasetSlug}/request-revision`,
    data
  );
  return response.data.data;
}

/**
 * Publish an approved dataset to the public catalogue
 */
export async function publishDataset(datasetSlug: string): Promise<Dataset> {
  const response = await apiClient.post<ApiResponse<Dataset>>(
    `/admin/datasets/${datasetSlug}/publish`,
    {}
  );
  return response.data.data;
}

/**
 * Unpublish a dataset from the public catalogue (stays approved)
 */
export async function unpublishDataset(datasetSlug: string): Promise<Dataset> {
  const response = await apiClient.post<ApiResponse<Dataset>>(
    `/admin/datasets/${datasetSlug}/unpublish`,
    {}
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

/**
 * Invites
 */
export enum InviteRole {
  CONTRIBUTOR = 'contributor',
  ADMIN = 'admin',
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export interface OrganisationInvite {
  id: string;
  organisationId: string;
  organisationName: string;
  invitedEmail: string;
  invitedByEmail: string;
  invitedByName: string;
  role: InviteRole;
  status: InviteStatus;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface CreateInviteDto {
  invitedEmail: string;
  role: InviteRole;
  message?: string;
}

/**
 * Get invites for an organisation
 */
export async function getOrganisationInvites(
  organisationId: string
): Promise<OrganisationInvite[]> {
  const response = await apiClient.get<ApiResponse<OrganisationInvite[]>>(
    `/admin/organisations/${organisationId}/invites`
  );
  return response.data.data;
}

/**
 * Create an invite for an organisation
 */
export async function createInvite(
  organisationId: string,
  data: CreateInviteDto
): Promise<OrganisationInvite> {
  const response = await apiClient.post<ApiResponse<OrganisationInvite>>(
    `/admin/organisations/${organisationId}/invites`,
    data
  );
  return response.data.data;
}

/**
 * Revoke an invite
 */
export async function revokeInvite(
  organisationId: string,
  inviteId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete<ApiResponse<{ message: string }>>(
    `/admin/organisations/${organisationId}/invites/${inviteId}`
  );
  return response.data.data;
}

/**
 * Resend an invite
 */
export async function resendInvite(
  organisationId: string,
  inviteId: string
): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    `/admin/organisations/${organisationId}/invites/${inviteId}/resend`
  );
  return response.data.data;
}

/**
 * Permanently delete an invite
 */
export async function deleteInvite(inviteId: string): Promise<void> {
  await apiClient.delete(`/admin/invites/${inviteId}/permanent`);
}

/**
 * Dashboard statistics
 */
interface DashboardStatsResponse {
  datasets: {
    total: number;
    pending: number;
    byStatus: Record<string, number>;
    byOrganisation: Array<{ orgId: string; orgName: string; count: number }>;
  };
  users: {
    total: number;
  };
  organisations: number;
  downloads: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    topDatasets: Array<{ datasetId: string; title: string; count: number }>;
  };
  uploads: {
    thisMonth: number;
    thisWeek: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    description?: string;
    userName: string;
    datasetTitle?: string;
    timestamp: string;
  }>;
}

/**
 * Soft delete a dataset (admin only) - can be restored
 */
export async function deleteDataset(datasetSlug: string): Promise<void> {
  await apiClient.delete(`/admin/datasets/${datasetSlug}`);
}

/**
 * Archive a dataset (changes status to ARCHIVED)
 */
export async function archiveDataset(datasetSlug: string, reason?: string): Promise<Dataset> {
  const response = await apiClient.post<ApiResponse<Dataset>>(
    `/datasets/${datasetSlug}/archive`,
    reason ? { reason } : undefined
  );
  return response.data.data;
}

export interface DashboardStats {
  totalUsers: number;
  totalOrganisations: number;
  totalDatasets: number;
  pendingDatasets: number;
  totalDownloads: number;
  datasetStats: {
    byStatus: Record<string, number>;
    byOrganisation: Array<{ organisationId: string; organisationName: string; count: number }>;
  };
  downloadStats: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    topDatasets: Array<{ datasetId: string; datasetTitle: string; downloads: number }>;
  };
  uploadStats: {
    total: number;
    thisMonth: number;
    thisWeek: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    userName: string;
    entityType: string;
    timestamp: string;
    description?: string;
    datasetTitle?: string;
  }>;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<ApiResponse<DashboardStatsResponse>>(
    '/admin/dashboard/stats'
  );
  const stats = response.data.data;

  return {
    totalUsers: stats.users.total,
    totalOrganisations: stats.organisations,
    totalDatasets: stats.datasets.total,
    pendingDatasets: stats.datasets.pending,
    totalDownloads: stats.downloads.total,
    datasetStats: {
      byStatus: stats.datasets.byStatus,
      byOrganisation: stats.datasets.byOrganisation.map((organisation) => ({
        organisationId: organisation.orgId,
        organisationName: organisation.orgName,
        count: organisation.count,
      })),
    },
    downloadStats: {
      total: stats.downloads.total,
      thisMonth: stats.downloads.thisMonth,
      thisWeek: stats.downloads.thisWeek,
      topDatasets: stats.downloads.topDatasets.map((dataset) => ({
        datasetId: dataset.datasetId,
        datasetTitle: dataset.title,
        downloads: dataset.count,
      })),
    },
    uploadStats: {
      total: stats.datasets.total,
      thisMonth: stats.uploads.thisMonth,
      thisWeek: stats.uploads.thisWeek,
    },
    recentActivity: stats.recentActivity.map((activity) => ({
      id: activity.id,
      action: activity.action,
      userName: activity.userName,
      entityType: activity.entityType,
      description: activity.description,
      datasetTitle: activity.datasetTitle,
      timestamp: activity.timestamp,
    })),
  };
}

export interface ActivityDataPoint {
  date: string;
  views: number;
  downloads: number;
}

/**
 * Get real daily views/downloads series for the platform activity graph
 */
export async function getDashboardActivity(): Promise<{
  data7d: ActivityDataPoint[];
  data30d: ActivityDataPoint[];
}> {
  const response = await apiClient.get<ApiResponse<{ data7d: ActivityDataPoint[]; data30d: ActivityDataPoint[] }>>(
    '/admin/dashboard/activity'
  );
  return response.data.data;
}

/**
 * Export a generic admin API client for custom requests
 */
export const adminApi = apiClient;
