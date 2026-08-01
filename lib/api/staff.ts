import { apiClient } from './client';
import type { PaginatedResponse } from '../types/common';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface StaffMember {
  id: string;
  email: string;
  fullName: string;
  status: 'pending' | 'active' | 'suspended' | 'archived';
  groupId: string | null;
  groupName: string | null;
  groupIsActive: boolean | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface StaffInvite {
  id: string;
  invitedEmail: string;
  invitedByEmail: string;
  invitedByName: string;
  targetGroupId: string;
  targetGroupName: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

interface StaffListResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StaffMemberListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: StaffMember['status'];
}

export interface StaffInviteListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: StaffInvite['status'];
}

export interface CreateStaffInvitePayload {
  invited_email: string;
  target_group_id: string;
  message?: string;
}

export interface ValidateStaffInviteResponse {
  valid: boolean;
  targetGroupId: string;
  targetGroupName: string;
  invitedEmail: string;
  expiresAt: string;
  invitedByName: string;
}

export interface AcceptStaffInvitePayload {
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
}

export interface AcceptStaffInviteResponse {
  message: string;
  userId: string;
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}

export async function getStaffMembers(
  params?: StaffMemberListParams,
): Promise<PaginatedResponse<StaffMember>> {
  const response = await apiClient.get<ApiResponse<StaffListResponse<StaffMember>>>('/admin/staff', {
    params: params as Record<string, unknown>,
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

export async function getStaffInvites(
  params?: StaffInviteListParams,
): Promise<PaginatedResponse<StaffInvite>> {
  const response = await apiClient.get<ApiResponse<StaffListResponse<StaffInvite>>>('/admin/staff/invites', {
    params: params as Record<string, unknown>,
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

export async function createStaffInvite(payload: CreateStaffInvitePayload): Promise<StaffInvite> {
  const response = await apiClient.post<ApiResponse<StaffInvite>>('/admin/staff/invites', payload);
  return response.data.data;
}

export async function revokeStaffInvite(inviteId: string): Promise<void> {
  await apiClient.delete<ApiResponse<{ message: string }>>(`/admin/staff/invites/${inviteId}`);
}

export async function resendStaffInvite(inviteId: string): Promise<StaffInvite> {
  const response = await apiClient.post<ApiResponse<StaffInvite>>(`/admin/staff/invites/${inviteId}/resend`);
  return response.data.data;
}

export async function revokeStaffStatus(userId: string): Promise<void> {
  await apiClient.delete<ApiResponse<{ message: string }>>(`/admin/staff/${userId}`);
}

// Public — used by the accept-invite page, reachable before the user has an account
export async function validateStaffInviteToken(token: string): Promise<ValidateStaffInviteResponse> {
  const response = await apiClient.get<ApiResponse<ValidateStaffInviteResponse>>(
    `/admin/staff/invites/${token}/validate`,
  );
  return response.data.data;
}

export async function acceptStaffInvite(
  token: string,
  payload: AcceptStaffInvitePayload,
): Promise<AcceptStaffInviteResponse> {
  const response = await apiClient.post<ApiResponse<AcceptStaffInviteResponse>>(
    `/admin/staff/invites/${token}/accept`,
    payload,
  );
  return response.data.data;
}
