import { useQuery } from '@tanstack/react-query';
import { getUserPermissions, type PermissionActionKey } from '@/lib/api/permissions';

/**
 * Hook to get the current user's permissions
 * Returns the list of permission action keys the user has access to
 * Super admins get all permissions, staff get their delegated permissions
 */
export function usePermissions() {
  const { data: permissions = [], isLoading, error } = useQuery({
    queryKey: ['permissions', 'me'],
    queryFn: getUserPermissions,
    // Short staleTime + refetch-on-focus (overriding the app-wide default of
    // false): a super_admin editing a staff member's group grants elsewhere
    // has no way to push that change into the staff member's already-open
    // session, so this needs to notice on its own reasonably quickly —
    // otherwise a just-granted permission silently doesn't show up until
    // the affected user thinks to hard-refresh.
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: PermissionActionKey): boolean => {
    return permissions.includes(permission);
  };

  /**
   * Check if user has any of the given permissions
   */
  const hasAnyPermission = (...perms: PermissionActionKey[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  /**
   * Check if user has all of the given permissions
   */
  const hasAllPermissions = (...perms: PermissionActionKey[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
