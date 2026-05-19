'use client';

/**
 * usePermissions Hook
 *
 * React hook for checking permissions in client components.
 * Provides convenient access to RBAC functionality.
 *
 * @see ADR-007: Auth Framework Design
 */

import { useSession } from 'next-auth/react';
import {
  hasPermission,
  hasMinimumRole,
  getUserAccessibleResources,
  getUserActionsForResource,
  type Resource,
  type Action,
} from '@/lib/auth/permissions';
import { isSuperAdmin, type Role } from '@/config/roles';

// =============================================================================
// Types
// =============================================================================

export interface UsePermissionsReturn {
  /**
   * Check if current user can perform action on resource
   *
   * @example
   * const { can } = usePermissions();
   * if (can('users', 'delete')) {
   *   return <DeleteButton />;
   * }
   */
  can: (resource: Resource, action: Action) => boolean;

  /**
   * Check if current user has at least the specified role
   *
   * @example
   * const { hasRole } = usePermissions();
   * if (hasRole('admin')) {
   *   return <AdminPanel />;
   * }
   */
  hasRole: (minimumRole: Role | string) => boolean;

  /**
   * Current user's role (or null if not authenticated)
   */
  role: string | null;

  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;

  /**
   * Whether the user is a super admin
   */
  isSuperAdmin: boolean;

  /**
   * List of resources the user can access
   */
  accessibleResources: Resource[];

  /**
   * Get actions available for a specific resource
   */
  getActionsFor: (resource: Resource) => Action[];

  /**
   * Session loading state
   */
  isLoading: boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for checking permissions in React components
 *
 * @returns Permission checking utilities
 *
 * @example
 * function UserManagement() {
 *   const { can, isLoading } = usePermissions();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       {can('users', 'create') && <CreateUserButton />}
 *       {can('users', 'list') && <UserList />}
 *     </div>
 *   );
 * }
 *
 * @example
 * function AdminRoute({ children }) {
 *   const { hasRole, isLoading } = usePermissions();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!hasRole('admin')) return <Unauthorized />;
 *
 *   return children;
 * }
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  // Cast to extended session type that includes role
  const user = session?.user as { role?: string } | undefined;
  const role = user?.role ?? null;
  const userIsSuperAdmin = role ? isSuperAdmin(role) : false;

  return {
    can: (resource: Resource, action: Action) => hasPermission(role, resource, action),

    hasRole: (minimumRole: Role | string) => hasMinimumRole(role, minimumRole),

    role,
    isAuthenticated,
    isSuperAdmin: userIsSuperAdmin,

    accessibleResources: getUserAccessibleResources(role),

    getActionsFor: (resource: Resource) => getUserActionsForResource(role, resource),

    isLoading,
  };
}

// =============================================================================
// Utility Components (optional, for convenience)
// =============================================================================

/**
 * Component that only renders children if user has permission
 *
 * @example
 * <Can resource="users" action="delete">
 *   <DeleteButton />
 * </Can>
 */
export function Can({
  resource,
  action,
  children,
  fallback = null,
}: {
  resource: Resource;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!can(resource, action)) return fallback;

  return <>{children}</>;
}

/**
 * Component that only renders children if user has minimum role
 *
 * @example
 * <RequireRole role="admin">
 *   <AdminPanel />
 * </RequireRole>
 */
export function RequireRole({
  role,
  children,
  fallback = null,
}: {
  role: Role | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasRole, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!hasRole(role)) return fallback;

  return <>{children}</>;
}
