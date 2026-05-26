/**
 * Multi-tenant scoped database client — BR-1 enforcement layer.
 *
 * Wraps the raw Drizzle `db` so every read, write, update, and delete is
 * automatically constrained to a single user's rows. Every server action or
 * route handler that touches user-owned data MUST go through `scopedDb(userId)`
 * — never the bare `db` import.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Why this exists
 * ──────────────────────────────────────────────────────────────────────────
 * AgendaInteligente is multi-tenant with single-user data (no shared
 * workspaces). A bug in a single server action that forgets to filter by
 * userId leaks one user's tasks/goals/sheets to another. The blast radius
 * is total: there's no team boundary to soften it.
 *
 * Approach: shift the filter from "every callsite remembers" to "the client
 * cannot forget". The factory binds a userId once and exposes per-table
 * builders that always include the `user_id = $1` clause for SELECTs and
 * inject `user_id` for INSERTs.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Allowed callers of the raw `db` (escape hatches)
 * ──────────────────────────────────────────────────────────────────────────
 *  - `src/lib/db/scoped.ts`   — this file, the implementation itself
 *  - `src/lib/db/schema/*.ts` — schema definitions, not queries
 *  - `src/lib/db/drizzle.ts`  — the client
 *  - `src/lib/db/seeds/*.ts`  — bootstrap, no user context
 *  - `src/lib/db/migrations/` — Drizzle migration runner
 *  - `src/lib/auth/auth.ts`   — NextAuth callbacks/events, operate on a
 *                               single user identified by OAuth flow, not
 *                               a session-bound userId. The Drizzle adapter
 *                               in the kit also queries `users` directly.
 *
 * ESLint enforcement (eslint.config.mjs §no-restricted-syntax) blocks any
 * other file from calling `db.select/insert/update/delete` directly on a
 * tenant table.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Tenant tables (registry — extend as the schema grows)
 * ──────────────────────────────────────────────────────────────────────────
 * Today (ISSUE-002):
 *   - notification_prefs (E-002)
 *   - subscriptions      (E-071)
 *   - usage_meters       (E-072)
 *
 * Future issues will register their tables here as they land:
 *   - categories            (ISSUE-010)
 *   - projects              (ISSUE-012)
 *   - activities, subtasks  (ISSUE-013, ISSUE-015)
 *   - goals, goal_links     (ISSUE-040, ISSUE-041)
 *   - day/week/month sheets (ISSUE-030, ISSUE-032, ISSUE-131)
 *   - conversations, messages, proactive_tasks (ISSUE-051, ISSUE-082)
 *   - calendar_connections, calendar_busy_slots (ISSUE-090, ISSUE-091)
 *   - plan_snapshots        (ISSUE-140, ISSUE-141)
 *
 * To add a table: import it below, add it to TENANT_TABLES with the column
 * key that holds the owner's id ('userId' for all current tables).
 *
 * Linked: BR-1, R-T-006, FT-003, US-004.
 */

import { and, eq, type SQL } from 'drizzle-orm';
import { db } from './drizzle';
import { notificationPrefs } from './schema/notification-prefs';
import { subscriptions, usageMeters } from './schema/billing';

// ──────────────────────────────────────────────────────────────────────────
// Tenant table registry
// ──────────────────────────────────────────────────────────────────────────

/**
 * Registry of all user-scoped tables. Each entry maps a friendly key to the
 * Drizzle table object. Every table here MUST have a `userId: uuid` column.
 *
 * Adding a row here automatically:
 *   - exposes `scopedDb(uid).select|insert|update|delete(<key>)` builders
 *   - extends the ESLint rule's awareness via the export below
 */
export const TENANT_TABLES = {
  notificationPrefs,
  subscriptions,
  usageMeters,
} as const;

export type TenantTableKey = keyof typeof TENANT_TABLES;
export type TenantTable = (typeof TENANT_TABLES)[TenantTableKey];

// ──────────────────────────────────────────────────────────────────────────
// scopedDb(userId)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Build a user-scoped database client. All operations on tenant tables are
 * automatically constrained to rows owned by `userId`.
 *
 * @example
 *   const sdb = scopedDb(session.user.id);
 *
 *   // SELECT — auto-filtered by user_id
 *   const prefs = await sdb.select('notificationPrefs').execute();
 *
 *   // INSERT — auto-injected user_id
 *   await sdb.insert('subscriptions', { planId: 'free-plan-uuid' });
 *
 *   // UPDATE — only rows owned by user can be updated, with extra where
 *   await sdb
 *     .update('usageMeters', { aiCallsCount: 1 })
 *     .where(eq(usageMeters.periodStart, '2026-05-01'));
 *
 *   // DELETE — only rows owned by user
 *   await sdb.delete('notificationPrefs');
 */
export function scopedDb(userId: string) {
  if (!userId || typeof userId !== 'string') {
    throw new Error(
      'scopedDb(userId) requires a non-empty userId. Did you forget to await auth()?'
    );
  }

  const tableUserIdEq = <K extends TenantTableKey>(key: K) => {
    const table = TENANT_TABLES[key] as { userId: unknown };
    return eq(table.userId as never, userId);
  };

  return {
    /** Raw userId — read-only, for callers that need it (e.g. audit metadata). */
    get userId(): string {
      return userId;
    },

    /** SELECT scoped to userId. Returns a Drizzle builder you can chain on. */
    select<K extends TenantTableKey>(key: K) {
      return db
        .select()
        .from(TENANT_TABLES[key] as never)
        .where(tableUserIdEq(key));
    },

    /**
     * INSERT with userId auto-injected. Pass values WITHOUT userId — the
     * factory will set it. If you pass userId in values, it's overwritten
     * with the bound userId (defensive — no spoofing).
     */
    insert<K extends TenantTableKey>(
      key: K,
      values: Record<string, unknown> | Record<string, unknown>[]
    ) {
      const inject = (v: Record<string, unknown>) => ({ ...v, userId });
      const payload = Array.isArray(values) ? values.map(inject) : inject(values);
      return db.insert(TENANT_TABLES[key] as never).values(payload as never);
    },

    /**
     * UPDATE scoped to userId. The returned builder lets you chain `.set()`
     * and `.where()`. The userId filter is ALWAYS applied via AND with any
     * extra where clause you provide.
     */
    update<K extends TenantTableKey>(key: K, set: Record<string, unknown>) {
      const builder = db
        .update(TENANT_TABLES[key] as never)
        .set(set as never)
        .where(tableUserIdEq(key));
      // Preserve a `.where()` chain that AND-combines with the user filter.
      return {
        where(extra: SQL) {
          return db
            .update(TENANT_TABLES[key] as never)
            .set(set as never)
            .where(and(tableUserIdEq(key), extra));
        },
        execute: builder.execute.bind(builder),
        returning: builder.returning.bind(builder),
      };
    },

    /** DELETE scoped to userId. Mirrors `update` shape. */
    delete<K extends TenantTableKey>(key: K) {
      const builder = db.delete(TENANT_TABLES[key] as never).where(tableUserIdEq(key));
      return {
        where(extra: SQL) {
          return db.delete(TENANT_TABLES[key] as never).where(and(tableUserIdEq(key), extra));
        },
        execute: builder.execute.bind(builder),
        returning: builder.returning.bind(builder),
      };
    },
  };
}

export type ScopedDb = ReturnType<typeof scopedDb>;
