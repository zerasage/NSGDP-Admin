"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminAuthApi } from "@/lib/api/admin-auth";
import * as tokenStorage from "@/lib/utils/token-storage";
import type { AdminUserProfile, MfaMethod } from "@/lib/api/admin-auth";
import { toast } from "sonner";

export interface LoginResult {
  requiresMfa: boolean;
  mfaMethod?: MfaMethod | null;
}

interface AuthContextType {
  user: AdminUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: { email: string; password: string; mfaCode?: string }) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from tokens on mount
  useEffect(() => {
    const loadUser = async () => {
      const accessToken = tokenStorage.getAccessToken();
      
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (tokenStorage.isTokenExpired()) {
        // Try to refresh
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          tokenStorage.clearTokens();
          setIsLoading(false);
          return;
        }

        try {
          const { data: response } = await adminAuthApi.refresh(refreshToken);
          tokenStorage.updateAccessToken(response.accessToken, response.expiresIn);
          
          const { data: userProfile } = await adminAuthApi.getProfile();
          setUser(userProfile);
        } catch {
          // Refresh failed, clear everything
          tokenStorage.clearTokens();
          setUser(null);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: userProfile } = await adminAuthApi.getProfile();
        setUser(userProfile);
      } catch {
        // Token invalid, try refresh
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          tokenStorage.clearTokens();
          setIsLoading(false);
          return;
        }

        try {
          const { data: response } = await adminAuthApi.refresh(refreshToken);
          tokenStorage.updateAccessToken(response.accessToken, response.expiresIn);
          
          const { data: userProfile } = await adminAuthApi.getProfile();
          setUser(userProfile);
        } catch {
          // Refresh failed, clear everything
          tokenStorage.clearTokens();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (data: { email: string; password: string; mfaCode?: string }): Promise<LoginResult> => {
    try {
      const { data: response } = await adminAuthApi.login({
        email: data.email,
        password: data.password,
        mfaCode: data.mfaCode,
      });

      if (response.requiresMfa) {
        // Password was correct but a second factor is still needed — no
        // tokens yet. The caller (login page) holds the email/password and
        // re-calls login() with mfaCode once the user has entered it.
        return { requiresMfa: true, mfaMethod: response.mfaMethod };
      }

      // Store tokens
      tokenStorage.storeTokens(
        response.accessToken,
        response.refreshToken,
        response.expiresIn
      );

      setUser(response.user);
      toast.success("Logged in successfully");

      // Use window.location for reliable redirect
      window.location.href = "/";
      return { requiresMfa: false };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await adminAuthApi.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      toast.success("Logged out successfully");
      router.push("/login");
    }
  }, [router]);

  const refreshSession = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const { data: response } = await adminAuthApi.refresh(refreshToken);
      
      // Update access token
      tokenStorage.updateAccessToken(response.accessToken, response.expiresIn);

      // Fetch updated user profile
      const { data: userProfile } = await adminAuthApi.getProfile();
      setUser(userProfile);
    } catch {
      // Refresh failed, clear everything
      tokenStorage.clearTokens();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
