import { apiClient } from './client';

export interface AdminLoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AdminUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin';
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  lastLoginIp?: string;
}

export interface AdminAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requiresMfa: boolean;
  user: AdminUserProfile;
}

export interface VerifyMfaRequest {
  email: string;
  password: string;
  mfaCode: string;
}

export const adminAuthApi = {
  /**
   * Admin login - only for super admin users
   */
  login: (data: AdminLoginRequest) =>
    apiClient.post<AdminAuthResponse>('/admin/auth/login', data),

  /**
   * Verify MFA code and complete admin login
   */
  verifyMfa: (data: VerifyMfaRequest) =>
    apiClient.post<AdminAuthResponse>('/admin/auth/verify-mfa', data),

  /**
   * Refresh admin access token
   */
  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; expiresIn: number }>(
      '/admin/auth/refresh',
      { refreshToken }
    ),

  /**
   * Admin logout - revoke refresh token
   */
  logout: (refreshToken: string) =>
    apiClient.post('/admin/auth/logout', { refreshToken }),

  /**
   * Get admin profile
   */
  getProfile: () => apiClient.get<AdminUserProfile>('/admin/auth/me'),
};
