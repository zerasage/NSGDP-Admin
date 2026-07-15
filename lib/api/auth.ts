// Auth API Functions
// Clean, typed functions for all authentication endpoints

import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { ApiResponse } from "@/lib/types/common";
import type {
  AuthResponse,
  UserProfile,
  RegisterPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  RefreshTokenPayload,
} from "@/lib/types/auth";

/**
 * Register a new user
 * @returns AuthResponse with tokens (or null tokens if pending approval)
 */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiFetch<ApiResponse<AuthResponse>>(
    API_ROUTES.auth.register,
    {
      method: "POST",
      body: payload,
    }
  );
  return response.data;
}

/**
 * Login with email and password
 * @returns AuthResponse with tokens and user profile
 * @throws ApiError if credentials invalid or account status prevents login
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiFetch<ApiResponse<AuthResponse>>(
    API_ROUTES.auth.login,
    {
      method: "POST",
      body: payload,
    }
  );
  return response.data;
}

/**
 * Logout - revokes refresh token
 * @param refreshToken - The refresh token to revoke
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiFetch<ApiResponse<void>>(API_ROUTES.auth.logout, {
    method: "POST",
    body: { refreshToken },
  });
}

/**
 * Request password reset email
 * Always returns success (security: prevents email enumeration)
 */
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
  const response = await apiFetch<ApiResponse<{ message: string }>>(
    API_ROUTES.auth.forgotPassword,
    {
      method: "POST",
      body: payload,
    }
  );
  return response.data;
}

/**
 * Reset password using token from email
 * @param payload - Contains reset token and new password
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
  const response = await apiFetch<ApiResponse<{ message: string }>>(
    API_ROUTES.auth.resetPassword,
    {
      method: "POST",
      body: payload,
    }
  );
  return response.data;
}

/**
 * Refresh access token using refresh token
 * @returns New access token and expiry time
 */
export async function refreshAccessToken(payload: RefreshTokenPayload): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await apiFetch<
    ApiResponse<{ accessToken: string; expiresIn: number }>
  >(API_ROUTES.auth.refresh, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

/**
 * Get current user profile
 * Requires valid access token in Authorization header
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await apiFetch<ApiResponse<UserProfile>>(
    API_ROUTES.auth.me,
    {
      method: "GET",
    }
  );
  return response.data;
}
