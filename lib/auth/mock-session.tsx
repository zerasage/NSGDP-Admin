"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@/types";
import { mockUsers } from "@/lib/mock/users";
import { toast } from "sonner";

export type DatasetAccessState = "none" | "pending" | "approved";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

interface MockSessionContextType {
  currentUser: User;
  setRole: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
  sessionExpiresAt: number | null;
  getDatasetAccess: (datasetId: string) => DatasetAccessState;
  requestDatasetAccess: (datasetId: string, reason: string) => void;
  approveDatasetAccess: (datasetId: string) => void;
  pendingDownloadSlug: string | null;
  setPendingDownloadSlug: (slug: string | null) => void;
}

const MockSessionContext = createContext<MockSessionContextType | undefined>(undefined);

function getUserForRole(role: UserRole): User {
  const map: Partial<Record<UserRole, User>> = {
    admin: mockUsers.admin,
    super_admin: mockUsers.superAdmin,
  };
  return map[role] ?? mockUsers[role] ?? mockUsers.public;
}

export function MockSessionProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>("public");
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [accessMap, setAccessMap] = useState<Record<string, DatasetAccessState>>({});
  const [pendingDownloadSlug, setPendingDownloadSlug] = useState<string | null>(null);

  const currentUser = getUserForRole(currentRole);
  const isAuthenticated = currentRole !== "public";

  const logout = useCallback(() => {
    setCurrentRole("public");
    setSessionExpiresAt(null);
    setPendingDownloadSlug(null);
  }, []);

  const setRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    if (role === "public") {
      setSessionExpiresAt(null);
    } else {
      setSessionExpiresAt(Date.now() + SESSION_DURATION_MS);
    }
  }, []);

  // Session expiry check
  useEffect(() => {
    if (!sessionExpiresAt || !isAuthenticated) return;
    const remaining = sessionExpiresAt - Date.now();
    if (remaining <= 0) {
      logout();
      toast.error("Your session has expired. Please log in again.");
      return;
    }
    const timer = setTimeout(() => {
      logout();
      toast.error("Your session has expired after 8 hours of inactivity.");
    }, remaining);
    return () => clearTimeout(timer);
  }, [sessionExpiresAt, isAuthenticated, logout]);

  const getDatasetAccess = useCallback(
    (datasetId: string): DatasetAccessState => accessMap[datasetId] ?? "none",
    [accessMap]
  );

  const requestDatasetAccess = useCallback((datasetId: string) => {
    setAccessMap((prev) => ({ ...prev, [datasetId]: "pending" }));
  }, []);

  const approveDatasetAccess = useCallback((datasetId: string) => {
    setAccessMap((prev) => ({ ...prev, [datasetId]: "approved" }));
  }, []);

  return (
    <MockSessionContext.Provider
      value={{
        currentUser,
        setRole,
        logout,
        isAuthenticated,
        sessionExpiresAt,
        getDatasetAccess,
        requestDatasetAccess,
        approveDatasetAccess,
        pendingDownloadSlug,
        setPendingDownloadSlug,
      }}
    >
      {children}
    </MockSessionContext.Provider>
  );
}

export function useMockSession() {
  const ctx = useContext(MockSessionContext);
  if (!ctx) throw new Error("useMockSession must be used within MockSessionProvider");
  return ctx;
}
