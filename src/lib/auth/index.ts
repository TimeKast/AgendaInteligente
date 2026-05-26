/**
 * Auth Module Exports
 *
 * Central export point for all authentication-related functionality.
 *
 * @see ADR-007: Auth Framework Design
 */

// =============================================================================
// NextAuth Configuration
// =============================================================================
export { auth, signIn, signOut, handlers, hashPassword, verifyPassword } from './auth';

// =============================================================================
// Helpers (AgendaInteligente — ISSUE-003)
// =============================================================================
export { getCurrentUser, requireAuth } from './helpers';

// =============================================================================
// Super Admin System
// =============================================================================
export {
  // Detection
  isUserSuperAdmin,
  // Audit logging
  logSuperAdminAction,
  getRecentSuperAdminActions,
  alertSuperAdminUsage,
} from './super-admin';

// =============================================================================
// Permission System (RBAC)
// =============================================================================
export {
  // Core permission checks
  hasPermission,
  requirePermission,
  hasMinimumRole,
  // Resource discovery
  getUserAccessibleResources,
  getUserActionsForResource,
  // Utilities
  getPermissionSummary,
  isPermissionDefined,
  // Constants
  PERMISSIONS,
  // Types
  type Resource,
  type Action,
  type PermissionMatrix,
} from './permissions';

// =============================================================================
// Re-exports from Config
// =============================================================================
export {
  authFeatures,
  hasAuthEnabled,
  getEnabledProviders,
  isProviderEnabled,
  type AuthProvider,
  type AuthFeatures,
} from '@/config/auth-features';

export {
  ROLES,
  ROLE_HIERARCHY,
  getRoleLevel,
  hasRoleOrHigher,
  isValidRole,
  getDefaultRole,
  isSuperAdmin,
  getRoleDisplayName,
  getAssignableRoles,
  type Role,
} from '@/config/roles';
