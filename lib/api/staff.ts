import { apiClient } from './client';

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

export async function getStaffMembers(): Promise<StaffMember[]> {
  const response = await apiClient.get<ApiResponse<StaffMember[]>>('/admin/staff');
  return response.data.data;
}

export async function getStaffInvites(): Promise<StaffInvite[]> {
  const response = await apiClient.get<ApiResponse<StaffInvite[]>>('/admin/staff/invites');
  return response.data.data;
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
