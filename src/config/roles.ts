/**
 * Role System Configuration
 *
 * Configurable role hierarchy for RBAC (Role-Based Access Control).
 * Roles are stored as text in the database to avoid migrations when adding new roles.
 *
 * ROLE_CONFIG is the Single Source of Truth (SSOT) for all role metadata:
 * - Display names
 * - UI styles (badge, dot, text)
 * - Capabilities (canInvite, assignableRoles)
 *
 * To add a new role:
 * 1. Add constant to ROLES
 * 2. Add entry to ROLE_HIERARCHY (position = privilege level)
 * 3. Add full config to ROLE_CONFIG (display, style, capabilities)
 *
 * @see ADR-007: Auth Framework Design
 */

// =============================================================================
// Role Definitions
// =============================================================================

/**
 * Available roles in the system.
 * Customize per project — add/remove as needed.
 *
 * @example E-commerce project:
 * export const ROLES = {
 *   SUPER_ADMIN: 'super_admin',
 *   ADMIN: 'admin',
 *   SELLER: 'seller',
 *   CUSTOMER: 'customer',
 * } as const;
 *
 * @example SaaS project:
 * export const ROLES = {
 *   SUPER_ADMIN: 'super_admin',
 *   OWNER: 'owner',
 *   ADMIN: 'admin',
 *   MEMBER: 'member',
 *   GUEST: 'guest',
 * } as const;
 */
export const ROLES = {
  /** System super admin — has all permissions, cannot be deleted */
  SUPER_ADMIN: 'super_admin',
  /** Project admin — manages users and content */
  ADMIN: 'admin',
  /** Regular authenticated user */
  USER: 'user',
} as const;

/** Type for role values */
export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role hierarchy from highest to lowest privilege.
 * Order matters: first role has highest privileges.
 *
 * Used by `hasRoleOrHigher()` to determine access.
 */
export const ROLE_HIERARCHY: Role[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER];

// =============================================================================
// UI Design Tokens (Roles)
// =============================================================================

/**
 * Style definition for role UI elements.
 * Uses `color-500/15` opacity for backgrounds — works in ALL themes (light, dark, midnight)
 * without needing `dark:` variants.
 */
export interface RoleStyle {
  /** Classes for badge pill (bg + text) */
  badge: string;
  /** Class for dot indicator (e.g., in TableFilter) */
  dot: string;
  /** Class for standalone text */
  text: string;
}

// =============================================================================
// ROLE_CONFIG — Single Source of Truth (SSOT)
// =============================================================================

/**
 * Configuration for each role.
 * This is the SSOT for all role metadata — add new roles and capabilities here.
 *
 * @example Adding a new role:
 * ```ts
 * // 1. Add to ROLES
 * export const ROLES = { ...existing, EDITOR: 'editor' } as const;
 *
 * // 2. Add to ROLE_HIERARCHY (position = privilege)
 * export const ROLE_HIERARCHY = [..., ROLES.EDITOR, ROLES.USER];
 *
 * // 3. Add full config
 * editor: {
 *   displayName: 'Editor',
 *   canInvite: true,
 *   assignableRoles: ['editor', 'user'],
 *   style: { badge: '...', dot: '...', text: '...' },
 * },
 * ```
 *
 * @example Adding a new capability:
 * ```ts
 * // 1. Add to RoleConfig interface
 * interface RoleConfig { ..., canExport: boolean }
 *
 * // 2. Add value for each role in ROLE_CONFIG
 * super_admin: { ..., canExport: true },
 * admin: { ..., canExport: true },
 * user: { ..., canExport: false },
 *
 * // 3. Add helper function
 * export function canExport(role: string): boolean {
 *   return ROLE_CONFIG[role as Role]?.canExport ?? false;
 * }
 * ```
 */
export interface RoleConfig {
  /** Human-readable display name (for UI) */
  displayName: string;
  /** Whether this role can send invitations */
  canInvite: boolean;
  /** Roles that this role can assign to invited/created users */
  assignableRoles: Role[];
  /** UI design tokens for badges, dots, and text */
  style: RoleStyle;
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  super_admin: {
    displayName: 'Super Admin',
    canInvite: true,
    assignableRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER],
    style: {
      badge: 'bg-badge-purple-bg text-badge-purple-text',
      dot: 'bg-badge-purple-dot',
      text: 'text-badge-purple-text',
    },
  },
  admin: {
    displayName: 'Administrador',
    canInvite: true,
    assignableRoles: [ROLES.ADMIN, ROLES.USER],
    style: {
      badge: 'bg-badge-blue-bg text-badge-blue-text',
      dot: 'bg-badge-blue-dot',
      text: 'text-badge-blue-text',
    },
  },
  user: {
    displayName: 'Usuario',
    canInvite: false,
    assignableRoles: [],
    style: {
      badge: 'bg-badge-slate-bg text-badge-slate-text',
      dot: 'bg-badge-slate-dot',
      text: 'text-badge-slate-text',
    },
  },
};

const DEFAULT_ROLE_STYLE: RoleStyle = {
  badge: 'bg-badge-slate-bg text-badge-slate-text',
  dot: 'bg-badge-slate-dot',
  text: 'text-badge-slate-text',
};

// =============================================================================
// Role Utility Functions
// =============================================================================

/**
 * Get the privilege level of a role (lower = more privileged)
 *
 * @param role - The role to check
 * @returns The index in hierarchy (0 = highest), -1 if not found
 *
 * @example
 * getRoleLevel('super_admin') // 0
 * getRoleLevel('admin')       // 1
 * getRoleLevel('user')        // 2
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY.indexOf(role as Role);
}

/**
 * Check if a user's role meets or exceeds the required role level
 *
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if user has required role or higher
 *
 * @example
 * hasRoleOrHigher('admin', 'user')        // true (admin > user)
 * hasRoleOrHigher('user', 'admin')        // false (user < admin)
 * hasRoleOrHigher('super_admin', 'admin') // true (super_admin > admin)
 */
export function hasRoleOrHigher(userRole: string, requiredRole: string): boolean {
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(requiredRole);

  // Invalid roles don't have access
  if (userLevel === -1 || requiredLevel === -1) {
    return false;
  }

  // Lower index = higher privilege
  return userLevel <= requiredLevel;
}

/**
 * Check if a role string is valid
 *
 * @param role - The role to validate
 * @returns true if role exists in ROLES
 *
 * @example
 * isValidRole('admin')   // true
 * isValidRole('hacker')  // false
 */
export function isValidRole(role: string): role is Role {
  return ROLE_HIERARCHY.includes(role as Role);
}

/**
 * Get the default role for new users
 *
 * @returns The lowest privilege role in hierarchy
 */
export function getDefaultRole(): Role {
  return ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1];
}

/**
 * Check if a role is the super admin role
 *
 * @param role - The role to check
 * @returns true if role is super_admin
 */
export function isSuperAdmin(role: string): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/**
 * Get display name for a role (for UI).
 * Reads from ROLE_CONFIG.
 *
 * @param role - The role to get display name for
 * @returns Human-readable role name
 *
 * @example
 * getRoleDisplayName('super_admin') // 'Super Admin'
 * getRoleDisplayName('user')        // 'Usuario'
 */
export function getRoleDisplayName(role: string): string {
  return ROLE_CONFIG[role as Role]?.displayName ?? role;
}

/**
 * Get all roles that a user with given role can assign to others.
 * Reads from ROLE_CONFIG.
 *
 * @param userRole - The role of the user doing the assignment
 * @returns Array of roles that can be assigned
 *
 * @example
 * getAssignableRoles('super_admin') // ['super_admin', 'admin', 'user']
 * getAssignableRoles('admin')       // ['admin', 'user']
 * getAssignableRoles('user')        // []
 */
export function getAssignableRoles(userRole: string): Role[] {
  return ROLE_CONFIG[userRole as Role]?.assignableRoles ?? [];
}

/**
 * Check if a role can send invitations.
 * Reads from ROLE_CONFIG.
 *
 * @param role - The role to check
 * @returns true if role has canInvite capability
 *
 * @example
 * canInvite('super_admin') // true
 * canInvite('admin')       // true
 * canInvite('user')        // false
 */
export function canInvite(role: string): boolean {
  return ROLE_CONFIG[role as Role]?.canInvite ?? false;
}

/** Get role style object. Reads from ROLE_CONFIG. Falls back to neutral gray. */
export function getRoleStyle(role: string): RoleStyle {
  return ROLE_CONFIG[role as Role]?.style ?? DEFAULT_ROLE_STYLE;
}
