import { apiClient } from './client';

export interface ValidateInviteResponse {
  valid: boolean;
  organisationId: string;
  organisationName: string;
  invitedEmail: string;
  role: 'contributor' | 'admin';
  expiresAt: string;
  invitedByName: string;
}

export interface AcceptInviteRequest {
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
}

export interface AcceptInviteResponse {
  message: string;
  userId: string;
}

/**
 * Validate an invite token
 */
export async function validateInvite(token: string): Promise<ValidateInviteResponse> {
  const response = await apiClient.get<ValidateInviteResponse>(`/invites/${token}/validate`);
  return response.data;
}

/**
 * Accept an invite and create user account
 */
export async function acceptInvite(
  token: string,
  data: AcceptInviteRequest
): Promise<AcceptInviteResponse> {
  const response = await apiClient.post<AcceptInviteResponse>(`/invites/${token}/accept`, data);
  return response.data;
}

/**
 * Create an invite (Admin only)
 */
export interface CreateInviteRequest {
  invitedEmail: string;
  role: 'contributor' | 'admin';
  message?: string;
}

export interface InviteResponse {
  id: string;
  organisationId: string;
  organisationName: string;
  invitedEmail: string;
  invitedByEmail: string;
  invitedByName: string;
  role: 'contributor' | 'admin';
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export async function createInvite(
  organisationId: string,
  data: CreateInviteRequest
): Promise<InviteResponse> {
  const response = await apiClient.post<InviteResponse>(
    `/admin/organisations/${organisationId}/invites`,
    data
  );
  return response.data;
}

/**
 * Get all invites for an organisation (Admin only)
 */
export async function getOrganisationInvites(
  organisationId: string
): Promise<InviteResponse[]> {
  const response = await apiClient.get<InviteResponse[]>(
    `/admin/organisations/${organisationId}/invites`
  );
  return response.data;
}

/**
 * Revoke an invite (Admin only)
 */
export async function revokeInvite(
  organisationId: string,
  inviteId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    `/admin/organisations/${organisationId}/invites/${inviteId}`
  );
  return response.data;
}

/**
 * Resend an invite (Admin only)
 */
export async function resendInvite(
  organisationId: string,
  inviteId: string
): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>(
    `/admin/organisations/${organisationId}/invites/${inviteId}/resend`
  );
  return response.data;
}
