"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { PermissionActionKey } from "@/lib/api/permissions";

/**
 * Standard admin-portal permission gate: super_admin bypass + delegated
 * Permission Group grants. Use `can("create:programs")` for action buttons
 * and `canAny(...)` for page-level view access.
 */
export function useAdminAccess() {
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, isLoading } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";

  return useMemo(
    () => ({
      isLoading,
      isSuperAdmin,
      can: (permission: PermissionActionKey) =>
        isSuperAdmin || hasPermission(permission),
      canAny: (...permissions: PermissionActionKey[]) =>
        isSuperAdmin || hasAnyPermission(...permissions),
    }),
    [isSuperAdmin, hasPermission, hasAnyPermission, isLoading],
  );
}
