/**
 * Soft Delete Helper
 *
 * Provides reusable soft delete field columns and query helpers.
 * Use this when you need to keep deleted records for audit/recovery purposes.
 *
 * @example Schema usage:
 * ```typescript
 * import { softDeleteFields } from '@/lib/db/helpers/soft-delete';
 *
 * export const orders = pgTable('orders', {
 *   id: uuid('id').primaryKey().defaultRandom(),
 *   // ... business fields
 *   ...softDeleteFields,
 * });
 * ```
 *
 * @example Query usage:
 * ```typescript
 * import { notDeleted } from '@/lib/db/helpers/soft-delete';
 *
 * // Get only active records
 * const activeOrders = await db
 *   .select()
 *   .from(orders)
 *   .where(notDeleted(orders));
 *
 * // Soft delete a record
 * await db.update(orders).set({
 *   deletedAt: new Date(),
 *   deletedBy: session.user.id,
 * }).where(eq(orders.id, orderId));
 * ```
 *
 * ## ⚠️ IMPORTANT LIMITATION
 *
 * The `notDeleted()` helper is **application-level only**. It does NOT enforce
 * soft delete filtering at the database level.
 *
 * **What this means:**
 * - Direct SQL queries (e.g., via psql, Drizzle Studio) WILL see deleted records
 * - You MUST remember to add `.where(notDeleted(table))` to all queries
 * - There are no DB triggers, views, or RLS policies in this helper
 *
 * **If you need database-level enforcement:**
 * You will need to implement custom solutions in your project, such as:
 * - PostgreSQL views that filter `WHERE deleted_at IS NULL`
 * - Row-Level Security (RLS) policies
 * - Database triggers
 *
 * @see SCHEMA-002
 */

import { timestamp, uuid } from 'drizzle-orm/pg-core';
import { isNull, SQL } from 'drizzle-orm';

/**
 * Soft delete fields for database tables.
 *
 * - `deletedAt` — When the record was soft deleted (null = active)
 * - `deletedBy` — User who deleted the record
 */
export const softDeleteFields = {
  /** Soft delete timestamp (null = active record) */
  deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),

  /** User who deleted the record */
  deletedBy: uuid('deleted_by'),
};

/**
 * Query helper to exclude soft-deleted records.
 *
 * @param table - The table with deletedAt field
 * @returns SQL condition for WHERE clause
 *
 * @example
 * ```typescript
 * const activeUsers = await db
 *   .select()
 *   .from(users)
 *   .where(notDeleted(users));
 * ```
 */
export function notDeleted<T extends { deletedAt: unknown }>(table: T): SQL {
  return isNull(table.deletedAt as Parameters<typeof isNull>[0]);
}
