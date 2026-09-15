import { apiClient } from './client';

// Backend wraps all responses in this structure
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

/**
 * Development partner invites (an org admin inviting a contributor/admin into
 * their own development partner) — distinct from staff invites (super_admin
 * inviting internal staff, see lib/api/staff.ts).
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

export interface DevelopmentPartnerInvite {
  id: string;
  developmentPartnerId: string;
  developmentPartnerName: string;
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
 * Get invites for a development partner
 */
export async function getDevelopmentPartnerInvites(
  developmentPartnerId: string
): Promise<DevelopmentPartnerInvite[]> {
  const response = await apiClient.get<ApiResponse<DevelopmentPartnerInvite[]>>(
    `/admin/development-partners/${developmentPartnerId}/invites`
  );
  return response.data.data;
}

/**
 * Create an invite for a development partner
 */
export async function createInvite(
  developmentPartnerId: string,
  data: CreateInviteDto
): Promise<DevelopmentPartnerInvite> {
  const response = await apiClient.post<ApiResponse<DevelopmentPartnerInvite>>(
    `/admin/development-partners/${developmentPartnerId}/invites`,
    data
  );
  return response.data.data;
}

/**
 * Revoke an invite
 */
export async function revokeInvite(
  developmentPartnerId: string,
  inviteId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete<ApiResponse<{ message: string }>>(
    `/admin/development-partners/${developmentPartnerId}/invites/${inviteId}`
  );
  return response.data.data;
}

/**
 * Resend an invite
 */
export async function resendInvite(
  developmentPartnerId: string,
  inviteId: string
): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    `/admin/development-partners/${developmentPartnerId}/invites/${inviteId}/resend`
  );
  return response.data.data;
}

/**
 * Permanently delete an invite
 */
export async function deleteInvite(inviteId: string): Promise<void> {
  await apiClient.delete(`/admin/invites/${inviteId}/permanent`);
}
