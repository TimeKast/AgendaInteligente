/**
 * Dynamic auth file paths for storageState.
 *
 * Generates paths from ROLES config — adding a role to roles.ts
 * automatically creates a new storageState slot. Zero maintenance.
 *
 * Used by auth.setup.ts to write and by specs to read.
 * This is NOT a test file — safe to import from any spec.
 *
 * @see SKT-002, SKT-003
 */

import path from 'path';
import { ROLES, type Role } from '@/config/roles';

export const AUTH_DIR = path.resolve(__dirname, '../.auth');

/**
 * Dynamic storageState paths — one per role in ROLES config.
 * Type-safe: AUTH_FILES['admin'], AUTH_FILES['user'], etc.
 */
export const AUTH_FILES = Object.fromEntries(
  Object.values(ROLES).map((role) => [role, path.join(AUTH_DIR, `${role}.json`)])
) as Record<Role, string>;

export type AuthRole = Role;

export const AUTH_META_FILE = path.join(AUTH_DIR, 'users.json');
