import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * TimeKast Factory — ESLint Configuration
 * Next.js 16+ | TypeScript | Flat Config
 *
 * Uses the new ESLint flat config format (eslint.config.mjs)
 * Compatible with Next.js 16+ built-in ESLint support
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Global ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'blob-report/**',
    'next-env.d.ts',
    '*.config.js',
    '*.config.mjs',
    'public/workbox-*.js',
    'public/sw.js',
  ]),

  // Custom rules (optional overrides)
  {
    rules: {
      // Block unused vars at commit time (lint-staged enforces this)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Allow explicit any in specific cases (escape hatch)
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Allow console in CLI scripts and logger (they run outside Next.js runtime or ARE the logger)
  {
    files: ['lib/logger.ts', 'lib/db/seed.ts', 'scripts/**/*.mjs', 'scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // BR-1 — Multi-tenant data isolation enforcement (ISSUE-005)
  //
  // Forbid direct `db.select|insert|update|delete()` calls outside the
  // small set of files allowed to bypass scopedDb: the scopedDb impl
  // itself, migrations, seeds, schema definitions, the drizzle client,
  // and the kit-shipped admin/auth subsystems that operate outside the
  // tenant-user model.
  //
  // Tier-1 enforcement via no-restricted-syntax — catches direct `db.x()`
  // calls. Aliased imports (`import { db as foo }`) bypass; ratchet up
  // to a custom rule if that becomes a real anti-pattern.
  // ───────────────────────────────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/lib/db/scoped.ts',
      'src/lib/db/drizzle.ts',
      'src/lib/db/seed.ts',
      'src/lib/db/seeds/**',
      'src/lib/db/schema/**',
      'src/lib/db/migrations/**',
      'src/lib/db/helpers/**', // kit user-admin helpers (can-hard-delete, etc)
      'src/lib/db/queries/**', // ISSUE-030: DB primitives consumed by actions; explicit userId scoping
      'src/lib/auth/auth.ts',
      'src/lib/auth/auth.config.ts',
      'src/lib/auth/password-reset.ts',
      'src/lib/auth/super-admin.ts',
      // ISSUE-004 — token-based flow; operates pre-session (no userId from
      // auth() yet). Mirrors password-reset.ts pattern.
      'src/lib/auth/email-verification.ts',
      'src/app/api/auth/verify/**',
      'src/lib/audit.ts', // audit_logs is admin table, not tenant
      'src/lib/audit/**',
      'src/lib/rate-limit/**',
      'src/lib/notifications/**',
      'src/lib/email/**',
      'src/lib/invites/**', // invite_tokens is admin table
      'src/lib/actions/admin/**',
      'src/lib/actions/audit.ts',
      'src/lib/actions/avatar.ts',
      'src/lib/actions/change-password.ts',
      'src/lib/actions/notifications.ts',
      'src/lib/actions/profile.ts',
      'src/lib/actions/send-reset-email.ts',
      // Onboarding finalize needs `db.transaction` over 5 tables (Inbox cat,
      // Inbox project, notif_prefs, subscription, users.onboarding_completed_at).
      // scopedDb can't model atomicity across tables, so the action uses `db`
      // directly with explicit `where(eq(table.userId, userId))` scoping.
      'src/lib/actions/onboarding.ts',
      // ISSUE-011: deleteCategory cascades over categories + projects +
      // activities in a single transaction; reorderCategories applies N
      // UPDATEs inside one tx. Same userId-scoping pattern as onboarding.
      'src/lib/actions/category.ts',
      // ISSUE-015: subtasks have no user_id column (E-006 spec fidelity —
      // BR-5). Ownership is enforced via the parent activity through
      // scopedDb('activities'); subtask CRUD goes through `db` directly
      // with explicit activity_id scoping.
      'src/lib/actions/subtask.ts',
      // ISSUE-041: goal_links is polymorphic M2M (E-011) with no user_id
      // column. Ownership enforced via parent goal through scopedDb('goals')
      // AND target row through scopedDb('projects'|'activities') BEFORE any
      // db.* call. Same isolation guarantee as subtasks.
      'src/lib/actions/goal-link.ts',
      // ISSUE-051: messages have no user_id column (E-031 spec). Ownership
      // enforced via parent conversation through scopedDb('conversations')
      // before any db.* call on messages. Mirror subtask / goal-link.
      'src/lib/actions/conversation.ts',
      // ISSUE-054: intensity mode lives on `users` (not a tenant table).
      // Direct db.update(users) with explicit eq(users.id, userId) scoping.
      'src/lib/actions/intensity.ts',
      // Same pattern as intensity: language + timezone live on users.
      // Used by /settings/language. Explicit eq(users.id, userId) scope.
      'src/lib/actions/language.ts',
      // notification_prefs upsert + users.contact_channels in one action.
      // Explicit eq scoping on both writes.
      'src/lib/actions/notification-prefs.ts',
      // ISSUE-024: recurrence materializer runs as a system task with an
      // explicit userId arg — no session context, so scopedDb can't bind.
      // Every read/write is scoped via `eq(activities.userId, userId)`.
      'src/lib/cron/recurrence.ts',
      'src/lib/cron/**',
      // ISSUE-080: Inngest fan-out cron lists all active users (`users`
      // table — admin-shaped, no userId scope possible). Per-user data
      // access still flows through scoped helpers (`materializeUserRecurrences`).
      'src/lib/inngest/**',
      'src/app/api/inngest/**',
      // ISSUE-052: chat SSE route reads users.intensity_mode +
      // preferred_language + onboarding_context + timezone for prompt
      // rendering. Single-user lookup scoped by eq(users.id, sessionUserId).
      'src/app/api/ai/chat/**',
      // ISSUE-073: parse-task reads users (TZ + lang) + projects (for
      // the prompt's matching block) by id, all scoped via
      // eq(*.userId, sessionUserId) on the WHERE clause.
      'src/app/api/ai/parse-task/**',
      // ISSUE-091: sync.ts is a unit-of-work for the cron + manual
      // trigger. Receives explicit userId; every read/write is scoped
      // via eq(*.userId, userId) or via the connectionId FK on rows
      // already proven to belong to that user.
      'src/lib/integrations/calendar/sync.ts',
      'src/app/api/auth/**',
      'src/app/api/avatar/**',
      'src/app/api/health/**',
      'src/app/api/notifications/**',
      'src/app/api/invites/**', // kit invite system
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.name='db'][callee.property.name=/^(select|insert|update|delete)$/]",
          message:
            'BR-1: use scopedDb(userId) instead of direct db.{select,insert,update,delete} on tenant tables. See src/lib/db/scoped.ts.',
        },
      ],
    },
  },
]);

export default eslintConfig;
