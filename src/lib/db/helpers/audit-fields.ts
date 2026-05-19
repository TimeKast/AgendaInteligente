/**
 * Audit Fields Helper
 *
 * Provides reusable audit field columns for all database tables.
 * Includes createdAt/modifiedAt timestamps and createdBy/modifiedBy user references.
 *
 * @example
 * ```typescript
 * import { auditFields } from '@/lib/db/helpers/audit-fields';
 *
 * export const orders = pgTable('orders', {
 *   id: uuid('id').primaryKey().defaultRandom(),
 *   // ... business fields
 *   ...auditFields,
 * });
 * ```
 *
 * Note: FK constraints for createdBy/modifiedBy → users.id should be added
 * via migration SQL to avoid circular imports. Example:
 * ```sql
 * ALTER TABLE orders ADD CONSTRAINT orders_created_by_fkey
 *   FOREIGN KEY (created_by) REFERENCES users(id);
 * ```
 *
 * @see SCHEMA-001
 */

import { timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Standard audit fields for database tables.
 *
 * - `createdAt` — When the record was created (auto-set)
 * - `createdBy` — User who created the record (nullable for system/seed data)
 * - `modifiedAt` — When the record was last modified (auto-updated)
 * - `modifiedBy` — User who last modified the record (nullable)
 */
export const auditFields = {
  /** Record creation timestamp (auto-set on insert) */
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),

  /** User who created the record (nullable for seed/system data) */
  createdBy: uuid('created_by'),

  /** Last modification timestamp (auto-updated on change) */
  modifiedAt: timestamp('modified_at', { mode: 'date', withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  /** User who last modified the record */
  modifiedBy: uuid('modified_by'),
};
