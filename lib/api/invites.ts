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
 * Organisation invites (an org admin inviting a contributor/admin into their
 * own org) — distinct from staff invites (super_admin inviting internal
 * staff, see lib/api/staff.ts).
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
