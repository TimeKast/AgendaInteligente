'use server';

/**
 * User Admin Server Actions
 *
 * Server-side actions for admin user management (CRUD).
 * Only accessible by ADMIN and SUPER_ADMIN roles.
 *
 * @see CRUD-002
 * @see SK-001 — Migrated to withAuth() helpers
 * @see SK-002 — StatusToggle + Soft/Hard Delete
 */

import { eq, and, isNull, asc, count, sql } from 'drizzle-orm';
import { getNextHumanId, HUMAN_ID_PREFIXES } from '@/lib/utils/human-id';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/permissions';
import { isSuperAdmin, getAssignableRoles } from '@/config/roles';
import { createUserSchema, updateUserSchema } from '@/lib/validations/admin/user-admin';
import { redirect } from 'next/navigation';
import { hashPassword } from '@/lib/auth';
import { withAuth } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import { canHardDeleteUser, type CanHardDeleteResult } from '@/lib/db/helpers/can-hard-delete';

// =============================================================================
// Types
// =============================================================================

export type UserListItem = {
  id: string;
  humanId: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: Date;
  deletedAt: Date | null;
};

// =============================================================================
// List Users
// =============================================================================

/**
 * Get all users for admin listing (active + inactive).
 *
 * @returns List of all users including soft-deleted
 */
export async function getUsers(): Promise<UserListItem[]> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  requirePermission(session.user.role, 'users', 'list');

  const result = await db
    .select({
      id: users.id,
      humanId: users.humanId,
      name: users.name,
      email: users.email,
      role: users.role,
      image: users.image,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt), asc(users.id));

  return result;
}

// =============================================================================
// Get Adjacent Users (for prev/next navigator)
// =============================================================================

export type AdjacentUser = {
  id: string;
  humanId: string;
  name: string | null;
  email: string;
} | null;

/**
 * Get the previous and next users relative to the given user ID.
 * Uses the same ordering as getUsers (createdAt ASC, id ASC).
 *
 * Uses a single CTE with ROW_NUMBER/LAG/LEAD window functions to avoid
 * round-tripping timestamps through JavaScript Date (which loses microsecond
 * precision and breaks equality comparisons in PostgreSQL).
 *
 * @param humanId - The current user's human ID (e.g. 'USR-0001')
 * @returns { prev, next, currentIndex, total } for pager display
 */
export async function getAdjacentUsers(
  humanId: string
): Promise<{ prev: AdjacentUser; next: AdjacentUser; currentIndex: number; total: number }> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  requirePermission(session.user.role, 'users', 'list');

  // Single CTE query: compute row_number, lag, lead entirely in SQL
  // This avoids passing timestamps back to JS (Date loses µs precision).
  const result = await db.execute<{
    id: string;
    rn: string; // ROW_NUMBER → bigint → string in PG
    total: string; // COUNT → bigint → string in PG
    prev_id: string | null;
    prev_name: string | null;
    prev_email: string | null;
    next_id: string | null;
    next_name: string | null;
    next_email: string | null;
    prev_human_id: string | null;
    next_human_id: string | null;
  }>(sql`
    WITH ranked AS (
      SELECT
        id, human_id, name, email,
        ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn,
        COUNT(*) OVER () AS total,
        LAG(id)       OVER (ORDER BY created_at ASC, id ASC) AS prev_id,
        LAG(human_id) OVER (ORDER BY created_at ASC, id ASC) AS prev_human_id,
        LAG(name)     OVER (ORDER BY created_at ASC, id ASC) AS prev_name,
        LAG(email)    OVER (ORDER BY created_at ASC, id ASC) AS prev_email,
        LEAD(id)       OVER (ORDER BY created_at ASC, id ASC) AS next_id,
        LEAD(human_id) OVER (ORDER BY created_at ASC, id ASC) AS next_human_id,
        LEAD(name)     OVER (ORDER BY created_at ASC, id ASC) AS next_name,
        LEAD(email)    OVER (ORDER BY created_at ASC, id ASC) AS next_email
      FROM users
    )
    SELECT * FROM ranked WHERE human_id = ${humanId}
  `);

  const row = result.rows?.[0];

  if (!row) {
    // User not found — return total count only
    const [{ total }] = await db.select({ total: count() }).from(users);
    return { prev: null, next: null, currentIndex: 0, total: Number(total) };
  }

  const currentIndex = Number(row.rn);
  const total = Number(row.total);

  const prev: AdjacentUser = row.prev_id
    ? { id: row.prev_id, humanId: row.prev_human_id!, name: row.prev_name, email: row.prev_email! }
    : null;

  const next: AdjacentUser = row.next_id
    ? { id: row.next_id, humanId: row.next_human_id!, name: row.next_name, email: row.next_email! }
    : null;

  return { prev, next, currentIndex, total };
}

// =============================================================================
// Get User by ID
// =============================================================================

/**
 * Get a single user by ID (humanId or UUID) for detail page.
 *
 * @param identifier - User humanId (e.g. 'USR-0001') or UUID
 * @returns User data or null if not found
 */
export async function getUserById(
  identifier: string
): Promise<(UserListItem & { image: string | null }) | null> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  requirePermission(session.user.role, 'users', 'read');

  // Resolve identifier: humanId (USR-XXXX) or UUID
  const isHumanId = identifier.startsWith('USR-');

  const [result] = await db
    .select({
      id: users.id,
      humanId: users.humanId,
      name: users.name,
      email: users.email,
      role: users.role,
      image: users.image,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(isHumanId ? eq(users.humanId, identifier) : eq(users.id, identifier))
    .limit(1);

  return result ?? null;
}

// =============================================================================
// Create User
// =============================================================================

/**
 * Create a new user.
 *
 * @param input - User data to create
 * @returns ActionResult with void data or error string
 */
export async function createUser(input: unknown): Promise<ActionResult> {
  return await withAuth(
    {
      resource: 'users',
      action: 'create',
      schema: createUserSchema,
      revalidate: '/settings/users',
    },
    input,
    async (data, userId) => {
      const { name, email, role, password } = data;

      // Check assignable roles
      const session = await auth();
      const assignableRoles = getAssignableRoles(session!.user!.role);
      if (!assignableRoles.includes(role as (typeof assignableRoles)[number])) {
        throw new ActionError('No puedes asignar ese rol');
      }

      // Check email uniqueness
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new ActionError('Ya existe un usuario con ese email');
      }

      // Hash password if provided
      const hashedPassword = password ? await hashPassword(password) : null;

      // Generate human ID from PG SEQUENCE with retry on collision.
      // The sequence may be out of sync after branch restore or seeding,
      // so we retry nextval up to 5 times on unique constraint violation.
      const MAX_RETRIES = 5;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const humanId = await getNextHumanId(db, 'user_human_id_seq', {
          prefix: HUMAN_ID_PREFIXES.USER,
          includeYear: false,
        });

        try {
          await db.insert(users).values({
            humanId,
            name,
            email,
            role,
            password: hashedPassword,
            createdBy: userId,
            modifiedBy: userId,
          });
          return; // success
        } catch (err: unknown) {
          // Drizzle wraps PG errors — check both top-level and cause
          const pgErr = err as {
            cause?: { code?: string; constraint?: string };
            code?: string;
            constraint?: string;
          };
          const code = pgErr.code || pgErr.cause?.code;
          const constraint = pgErr.constraint || pgErr.cause?.constraint;

          if (code === '23505' && constraint === 'users_human_id_unique') {
            continue; // retry with next sequence value
          }
          throw err; // non-humanId error — rethrow
        }
      }

      throw new ActionError(
        `No se pudo generar un ID único después de ${MAX_RETRIES} intentos. ` +
          `Contacta al administrador para resetear la secuencia.`
      );
    }
  );
}

// =============================================================================
// Update User
// =============================================================================

/**
 * Update an existing user.
 *
 * @param id - User ID to update
 * @param input - User data to update
 * @returns ActionResult with void data or error string
 */
export async function updateUser(id: string, input: unknown): Promise<ActionResult> {
  return await withAuth(
    {
      resource: 'users',
      action: 'update',
      schema: updateUserSchema,
      revalidate: '/settings/users',
    },
    input,
    async (data, userId) => {
      const { name, email, role } = data;

      // Get target user
      const [targetUser] = await db
        .select({ id: users.id, role: users.role, email: users.email })
        .from(users)
        .where(and(eq(users.id, id), isNull(users.deletedAt)))
        .limit(1);

      if (!targetUser) {
        throw new ActionError('Usuario no encontrado');
      }

      // Prevent demoting SUPER_ADMIN (unless you are SUPER_ADMIN)
      const session = await auth();
      if (isSuperAdmin(targetUser.role) && !isSuperAdmin(session!.user!.role)) {
        throw new ActionError('No puedes modificar a un Super Admin');
      }

      // Check assignable roles
      const assignableRoles = getAssignableRoles(session!.user!.role);
      if (!assignableRoles.includes(role as (typeof assignableRoles)[number])) {
        throw new ActionError('No puedes asignar ese rol');
      }

      // Check email uniqueness (if changed)
      if (email !== targetUser.email) {
        const existingUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          throw new ActionError('Ya existe un usuario con ese email');
        }
      }

      // Update user
      await db
        .update(users)
        .set({
          name,
          email,
          role,
          modifiedAt: new Date(),
          modifiedBy: userId,
        })
        .where(eq(users.id, id));
    }
  );
}

// =============================================================================
// Delete User (Soft Delete)
// =============================================================================

/**
 * Soft delete a user.
 *
 * Protections:
 * - Cannot delete yourself
 * - Cannot delete SUPER_ADMIN
 *
 * @param id - User ID to delete
 * @returns ActionResult with void data or error string
 */
export async function deleteUser(id: string): Promise<ActionResult> {
  const deleteSchema = z.object({ id: z.string().uuid() });

  return await withAuth(
    {
      resource: 'users',
      action: 'delete',
      schema: deleteSchema,
      revalidate: '/settings/users',
    },
    { id },
    async (data, userId) => {
      // Prevent self-delete
      if (data.id === userId) {
        throw new ActionError('No puedes eliminarte a ti mismo');
      }

      // Get target user
      const [targetUser] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(and(eq(users.id, data.id), isNull(users.deletedAt)))
        .limit(1);

      if (!targetUser) {
        throw new ActionError('Usuario no encontrado');
      }

      // Prevent deleting SUPER_ADMIN
      if (isSuperAdmin(targetUser.role)) {
        throw new ActionError('SUPER_ADMIN no puede ser eliminado');
      }

      // Soft delete
      await db
        .update(users)
        .set({
          deletedAt: new Date(),
          deletedBy: userId,
        })
        .where(eq(users.id, data.id));
    }
  );
}

// =============================================================================
// Toggle User Status (Soft Delete / Reactivate)
// =============================================================================

/**
 * Toggle a user's active status.
 *
 * - Active → Soft delete (set deletedAt + deletedBy)
 * - Inactive → Reactivate (clear deletedAt + deletedBy)
 *
 * Protections:
 * - Cannot toggle yourself
 * - Cannot toggle SUPER_ADMIN
 *
 * @param id - User ID to toggle
 * @returns ActionResult with { isActive: boolean }
 */
export async function toggleUserStatus(id: string): Promise<ActionResult<{ isActive: boolean }>> {
  const toggleSchema = z.object({ id: z.string().uuid() });

  return await withAuth(
    {
      resource: 'users',
      action: 'update',
      schema: toggleSchema,
      revalidate: '/settings/users',
    },
    { id },
    async (data, userId) => {
      // Prevent self-toggle
      if (data.id === userId) {
        throw new ActionError('No puedes desactivarte a ti mismo');
      }

      // Get target user
      const [targetUser] = await db
        .select({
          id: users.id,
          role: users.role,
          deletedAt: users.deletedAt,
        })
        .from(users)
        .where(eq(users.id, data.id))
        .limit(1);

      if (!targetUser) {
        throw new ActionError('Usuario no encontrado');
      }

      // Prevent toggling SUPER_ADMIN
      if (isSuperAdmin(targetUser.role)) {
        throw new ActionError('SUPER_ADMIN no puede ser desactivado');
      }

      const isCurrentlyActive = targetUser.deletedAt === null;

      if (isCurrentlyActive) {
        // Deactivate: soft delete
        await db
          .update(users)
          .set({
            deletedAt: new Date(),
            deletedBy: userId,
            modifiedAt: new Date(),
            modifiedBy: userId,
          })
          .where(eq(users.id, data.id));
      } else {
        // Reactivate: clear soft delete
        await db
          .update(users)
          .set({
            deletedAt: null,
            deletedBy: null,
            modifiedAt: new Date(),
            modifiedBy: userId,
          })
          .where(eq(users.id, data.id));
      }

      return { isActive: !isCurrentlyActive };
    }
  );
}

// =============================================================================
// Hard Delete User (Permanent)
// =============================================================================

/**
 * Permanently delete a user from the database.
 *
 * Guards:
 * - User must be already soft-deleted
 * - User must have no dependencies (canHardDelete check)
 * - Cannot hard-delete SUPER_ADMIN
 *
 * @param id - User ID to permanently delete
 * @returns ActionResult
 */
export async function hardDeleteUser(id: string): Promise<ActionResult> {
  const deleteSchema = z.object({ id: z.string().uuid() });

  return await withAuth(
    {
      resource: 'users',
      action: 'delete',
      schema: deleteSchema,
      revalidate: '/settings/users',
    },
    { id },
    async (data, userId) => {
      // Prevent self-delete
      if (data.id === userId) {
        throw new ActionError('No puedes eliminarte a ti mismo');
      }

      // Get target user
      const [targetUser] = await db
        .select({
          id: users.id,
          role: users.role,
          deletedAt: users.deletedAt,
        })
        .from(users)
        .where(eq(users.id, data.id))
        .limit(1);

      if (!targetUser) {
        throw new ActionError('Usuario no encontrado');
      }

      // Must be soft-deleted first
      if (targetUser.deletedAt === null) {
        throw new ActionError(
          'El usuario debe estar desactivado antes de eliminarlo permanentemente'
        );
      }

      // Cannot hard-delete SUPER_ADMIN
      if (isSuperAdmin(targetUser.role)) {
        throw new ActionError('SUPER_ADMIN no puede ser eliminado');
      }

      // Check dependencies (real-time, no flags)
      const eligibility = await canHardDeleteUser(data.id);
      if (!eligibility.canDelete) {
        throw new ActionError(eligibility.reason || 'El usuario tiene registros asociados');
      }

      // Permanent delete
      await db.delete(users).where(eq(users.id, data.id));
    }
  );
}

// =============================================================================
// Check Hard Delete Eligibility (Client-facing)
// =============================================================================

/**
 * Check if a user can be permanently deleted.
 *
 * Thin wrapper for client components to call the eligibility check.
 *
 * @param id - User ID to check
 * @returns CanHardDeleteResult
 */
export async function checkCanHardDelete(id: string): Promise<CanHardDeleteResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { canDelete: false, reason: 'Debes iniciar sesión' };
  }

  requirePermission(session.user.role, 'users', 'delete');

  return canHardDeleteUser(id);
}
