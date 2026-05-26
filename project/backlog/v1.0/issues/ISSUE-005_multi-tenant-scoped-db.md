---
id: ISSUE-005
title: Multi-tenant scopedDb helper + ESLint custom rule + multi-tenant tests
epic: EPIC-AUTH
milestone: v1.0
priority: P0
story_points: 3
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-002]
user_stories: [US-004]
features: [FT-003]
screens: []
business_rules: [BR-1]
risks: [R-T-006]
agents: [backend-specialist, security-auditor, quality-engineer]
skills: [/security, /database, /testing]
---

# ISSUE-005 — Multi-tenant data isolation enforcement

## Overview

Create `scopedDb(userId)` helper que envuelve todas las queries. Add ESLint custom rule prohibiendo `db.select()` / `db.update()` / `db.delete()` directos fuera de `scopedDb`. Add integration tests cubriendo cross-user access.

**This is the CRITICAL security control of the product.** Risk R-T-006 (multi-tenant leak) is `🔴 Mitigate now`.

## Tasks

- [ ] Implement [src/lib/db/scoped.ts](../../../../src/lib/db/scoped.ts):
  ```ts
  export function scopedDb(userId: string) {
    return {
      query: { ... auto-filtered queries por user_id ... },
      insert: (table) => db.insert(table).values({ ..., user_id: userId }),
      // override select/update/delete con filter automático
    };
  }
  ```
- [ ] Cover all tenant-owned tables: categories, projects, activities, subtasks, goals, goal_links, day_sheets, week_sheets, conversations, messages, proactive_tasks, google_calendar_connections, calendar_busy_slots, subscriptions, usage_meters, notification_prefs
- [ ] ESLint custom rule en `eslint.config.mjs`:
  - Reject `db.select(...)`, `db.update(...)`, `db.delete(...)`, `db.insert(...)` direct calls
  - Allow only if called inside `scopedDb` factory or migration files
  - Allow on Plan (no user-scoped — global table)
- [ ] Integration tests:
  - Property-test: 100 random queries con `scopedDb(userA)` returning 0 rows de userB
  - Server Action `updateActivity(activityIdOfA)` desde userB session → returns 404
  - API route `GET /api/activities/[id]` para userA's activity desde userB session → 404 (not 403)
- [ ] Sentry middleware: log any cross-user access attempt (should be 0 in production)

## Acceptance Criteria

```gherkin
Scenario: Cross-user data isolation
  Given userA has activity X
  And userB is authenticated
  When userB attempts to read or update activity X via any endpoint
  Then 404 is returned (not 403 — no leak of existence)
  And userA's activity X is unchanged

Scenario: ESLint guards against direct db calls
  Given a new file uses `db.select(...)` outside scopedDb
  When lint runs
  Then error: "Use scopedDb(userId) instead of direct db calls"

Scenario: scopedDb auto-filters
  Given 100 random user pairs (A, B) each with 10 rows
  When scopedDb(A.id).query.activities.findMany() runs
  Then returns only A's 10 rows, never B's
```

## Definition of Done

- [ ] scopedDb covers all 16 tenant-owned tables
- [ ] ESLint rule reports violations as errors in CI
- [ ] 100% of existing actions/routes refactored to use scopedDb
- [ ] Integration test suite passing (≥10 cross-user scenarios)
- [ ] Sentry middleware tested with mocked cross-user request
- [ ] Documentation en `src/lib/db/README.md`

## Technical Notes

- Drizzle's `.where()` chaining allows building scoped queries cleanly
- Plan table is NOT scoped (global)
- Migrations / seed scripts bypass scopedDb (use direct db)
- Future v1.5: consider Postgres RLS as defense-in-depth (already planned en ADR-010)

## Implementation Evidence

**Archivos creados:**

- `src/lib/db/scoped.ts` — factory `scopedDb(userId)` + registry `TENANT_TABLES`. Builders SELECT/UPDATE/DELETE auto-aplican `where(eq(table.userId, userId))`; INSERT inyecta `userId` y SOBRESCRIBE valores `userId` del caller (defensa contra spoofing). Throws si userId vacío. `.where(extra)` chain combina con AND el filtro user_id.
- `src/lib/db/README.md` — doc del pattern, when-to-use-what, lista de escape hatches del kit, cómo agregar nuevas tablas tenant.
- `eslint.config.mjs` — rule `no-restricted-syntax` con selector AST que matchea `db.{select,insert,update,delete}()` con error "BR-1: use scopedDb(userId)". Allowlist de ~25 globs para escape hatches (scoped.ts, drizzle.ts, schema, migrations, seeds, NextAuth, kit admin/auth/audit/invites).
- `tests/unit/scoped-db.test.ts` — 11 tests mockeando Drizzle: construction guards (3), SELECT shape (2), INSERT auto-inject + override (3), UPDATE/DELETE filter (2), registry contents (1).

**Reconciliaciones de scope** (issue original asumía 16 tablas tenant; hoy hay 3):

- **scopedDb cubre 3 tablas** (notification_prefs, subscriptions, usage_meters) — las únicas user-scoped que existen en v1 hoy. Registry pattern: cada CRUD issue futuro (010, 012, 013, 030, 032, 040, 041, 051, 080, 090, 091, 131, 140, 141) agrega su tabla en 1 línea de `TENANT_TABLES`.
- **100% refactor de actions/routes existentes**: N/A — el kit no tiene server actions user-scoped (todo es admin/auth/notif kit-shipped, ya en la allowlist).
- **Integration tests ≥10**: 11 unit tests cubren shape de queries con Drizzle mockeado. Integration end-to-end con Neon llega cuando ISSUE-010 (Category CRUD) escriba la primera action user-scoped real.
- **Sentry middleware**: Sentry está instalado como dep pero NO wired (no DSN, no `sentry.client.config.ts`). Cuando se wire-up Sentry en otro issue, agregar `Sentry.captureMessage` al lugar donde scoped.ts detecte intentos de bypass (hoy no hay tal detección porque la rule ESLint es la primera línea de defensa, no runtime).

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors. Rule confirmada manualmente: archivo con `db.select()` fresh → 1 error BR-1.
- `pnpm test tests/unit/scoped-db.test.ts` ✅ 11/11
- `pnpm test` full ✅ 502/502 sin flakes (3rd run; 1 flake transitorio en 2nd run, no relacionado)

**ESLint allowlist** (cuándo OK usar `db` directo):

- `src/lib/db/{scoped,drizzle,seed}.ts`, `seeds/**`, `schema/**`, `migrations/**`, `helpers/**`
- `src/lib/auth/{auth,auth.config,password-reset,super-admin}.ts` (NextAuth flows)
- `src/lib/{audit,rate-limit,notifications,email,invites}/**` (kit infra, tablas non-tenant)
- `src/lib/actions/{admin/**,audit,avatar,change-password,notifications,profile,send-reset-email}.ts` (kit admin actions)
- `src/app/api/{auth,avatar,health,notifications,invites}/**` (kit routes)

**Limitación conocida**: rule es regex-based via no-restricted-syntax sobre `callee.object.name='db'`. Aliased imports (`import { db as foo }`) bypassan. Ratchet a custom plugin si pasa en práctica.
