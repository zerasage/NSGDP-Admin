// Token Storage Utilities
// Secure storage for access and refresh tokens

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const TOKEN_EXPIRY_KEY = "tokenExpiry";

/**
 * Store auth tokens in localStorage
 */
export function storeTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  
  // Calculate expiry timestamp
  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if access token is expired
 */
export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true;
  
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return true;
  
  const expiry = parseInt(expiryStr, 10);
  // Add 60 second buffer to refresh before actual expiry
  return Date.now() >= expiry - 60000;
}

/**
 * Clear all auth tokens
 */
export function clearTokens(): void {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Update only the access token (used after refresh)
 */
export function updateAccessToken(accessToken: string, expiresIn: number): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  
  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}
