# `src/lib/db/` — Database layer

## When to use what

| Need                                            | Use                       |
| ----------------------------------------------- | ------------------------- |
| Query user-owned data (any tenant table)        | `scopedDb(userId)`        |
| Bootstrap / seed / migrations                   | `db` (the raw client)     |
| Schema definition                               | `schema/*.ts`             |
| One-off ad-hoc query (debugging)                | `pnpm db:query "SELECT…"` |
| Admin tables (audit_logs, invite_tokens, plans) | `db` (not user-scoped)    |

## `scopedDb(userId)` — BR-1 multi-tenant enforcement

Every server action, route handler, or cron job that reads/writes
user-owned data MUST go through `scopedDb`. The factory binds a userId once
and exposes per-table builders that always include a `user_id = $1` clause
on SELECT/UPDATE/DELETE and inject `userId` on INSERT.

```ts
import { auth } from '@/lib/auth';
import { scopedDb } from '@/lib/db/scoped';

export async function getPrefs() {
  const session = await auth();
  if (!session?.user) throw new Error('UNAUTHORIZED');

  const sdb = scopedDb(session.user.id);
  // SELECT scoped — never returns another user's row
  const rows = await sdb.select('notificationPrefs').execute();
  return rows[0] ?? null;
}

export async function recordCall() {
  const sdb = scopedDb(session.user.id);
  // INSERT — userId injected automatically
  await sdb.insert('usageMeters', {
    periodStart: '2026-05-01',
    aiCallsCount: 1,
  });
}
```

### Caller-supplied `userId` is overwritten

If a payload includes `userId`, the factory replaces it with the bound
userId. This is intentional defense against spoofing — never trust
client-controlled userId fields.

### Adding a new tenant table

When you add a new schema file with a user-scoped table:

1. Add the import + key in `src/lib/db/scoped.ts`'s `TENANT_TABLES` object.
2. The table is immediately covered by `scopedDb.select|insert|update|delete`.
3. ESLint will keep blocking direct `db.x()` calls on it everywhere
   (the rule is regex-based on `db.*`, not table-aware — it catches all
   direct calls outside the allowlist in `eslint.config.mjs`).

## ESLint enforcement

`eslint.config.mjs` has a `no-restricted-syntax` rule that errors on:

```ts
db.select(...)
db.insert(...)
db.update(...)
db.delete(...)
```

…outside an allowlist of files (the scopedDb impl, migrations, seeds,
schema, kit admin/auth code). Tier-1 enforcement; aliased imports
(`import { db as foo }`) currently bypass — escalate to a custom rule
plugin if that becomes a real anti-pattern.

## Raw `db` escape hatches (allowlisted in ESLint)

These files may call `db.x()` directly because they operate outside the
tenant-user model:

- `src/lib/db/scoped.ts` — the impl
- `src/lib/db/drizzle.ts` — the client itself
- `src/lib/db/seed.ts`, `seeds/**` — bootstrap (no session)
- `src/lib/db/schema/**` — definitions, no queries
- `src/lib/db/migrations/**` — Drizzle CLI
- `src/lib/db/helpers/**` — kit user-admin helpers (e.g. can-hard-delete)
- `src/lib/auth/auth.ts` + `auth.config.ts` + `password-reset.ts` +
  `super-admin.ts` — NextAuth flows query `users` directly
- `src/lib/audit.ts` — audit_logs is global, not tenant-owned
- `src/lib/invites/**` + `src/app/api/invites/**` — kit invite tokens
- `src/lib/rate-limit/**`, `notifications/**`, `email/**` — kit infra

The full allowlist lives in `eslint.config.mjs`. To add a new exception,
document **why** in a comment and prefer narrowing the scope (file path
over directory glob) when possible.

## Read-only inspection

For ad-hoc queries during development or debugging:

```bash
pnpm db:query --tables                      # list tables
pnpm db:query --describe <table>            # show columns
pnpm db:query "SELECT count(*) FROM users"  # read-only — writes blocked
```

The runner blocks any INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/CREATE.
Writes must go through migrations (`pnpm db:generate` → `pnpm db:migrate`).
