/**
 * RBAC Test Utilities
 *
 * Transforms ROUTE_ACL and ROLES from source-of-truth configs
 * into testable data structures for parametrized E2E tests.
 *
 * Zero maintenance: adding routes to ROUTE_ACL or roles to ROLES
 * automatically expands test coverage without touching spec files.
 *
 * @see SKT-003
 */

import { ROUTE_ACL, isRouteAllowed } from '@/lib/auth/permissions';
import { ROLES, ROLE_HIERARCHY, type Role } from '@/config/roles';

// =============================================================================
// Types
// =============================================================================

export interface ProtectedRoute {
  /** Route path (e.g. '/settings/users') */
  path: string;
  /** Roles explicitly allowed in ROUTE_ACL */
  allowed: Role[];
  /** Human-readable label for test names */
  label: string;
}

// =============================================================================
// Dynamic Data from SSOT
// =============================================================================

/**
 * All protected routes from ROUTE_ACL, formatted for parametrized tests.
 * Adding a route to ROUTE_ACL auto-expands test coverage.
 */
export const PROTECTED_ROUTES: ProtectedRoute[] = Object.entries(ROUTE_ACL).map(
  ([path, allowed]) => ({
    path,
    allowed: allowed as Role[],
    label: path,
  })
);

/**
 * Testable roles — all roles EXCEPT super_admin (who bypasses all ACL).
 * super_admin is tested separately since they always have access.
 */
export const TESTABLE_ROLES = ROLE_HIERARCHY.filter((r) => r !== ROLES.SUPER_ADMIN);

/**
 * All roles including super_admin.
 */
export const ALL_ROLES = Object.values(ROLES);

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get routes a role should be BLOCKED from accessing.
 */
export function getBlockedRoutes(role: Role): ProtectedRoute[] {
  return PROTECTED_ROUTES.filter((route) => !isRouteAllowed(route.path, role));
}

/**
 * Get routes a role SHOULD be able to access.
 */
export function getAllowedRoutes(role: Role): ProtectedRoute[] {
  return PROTECTED_ROUTES.filter((route) => isRouteAllowed(route.path, role));
}

/**
 * Check if there are any protected routes to test.
 * If ROUTE_ACL is empty (SK default), RBAC route tests are skipped.
 */
export function hasProtectedRoutes(): boolean {
  return PROTECTED_ROUTES.length > 0;
}
