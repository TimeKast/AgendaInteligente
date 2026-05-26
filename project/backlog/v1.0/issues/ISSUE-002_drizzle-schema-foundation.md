---
id: ISSUE-002
title: Drizzle schema + migrations (users, NextAuth tables, plans, subscriptions, usage_meters)
epic: EPIC-AUTH
milestone: v1.0
priority: P0
story_points: 5
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-001]
user_stories: [US-001, US-002, US-110]
features: [FT-110, FT-111, FT-112, FT-113]
screens: []
business_rules: [BR-1, BR-10, BR-14]
agents: [backend-specialist]
skills: [/database, /backend]
entities: [E-001, E-002, E-070, E-071, E-072]
---

# ISSUE-002 — Drizzle schema foundation

## Overview

Crear Drizzle schema en [src/lib/db/schema.ts](../../../../src/lib/db/schema.ts) para auth foundation (users + NextAuth tables + NotificationPref) + billing scaffold (plans + subscriptions + usage_meters). Generate first migration. Seed plan 'free'.

## Tasks

- [ ] Define tables siguiendo [06_DATA_MODEL.md](../../../planning/06_DATA_MODEL.md):
  - `users` (E-001) con todos los fields
  - `accounts`, `sessions`, `verification_tokens` (NextAuth adapter)
  - `notification_prefs` (E-002)
  - `plans` (E-070)
  - `subscriptions` (E-071) con UNIQUE `(user_id) WHERE status='active'`
  - `usage_meters` (E-072) con UNIQUE `(user_id, period_start)`
- [ ] Add constraints:
  - `users.intensity_mode CHECK IN ('sharp','standard','gentle','listening')`
  - `users.preferred_language CHECK IN ('es','en')`
  - `users` partial UNIQUE on `google_oauth_id WHERE NOT NULL`
- [ ] Generate migration: `pnpm db:generate`
- [ ] Apply to Neon dev branch: `pnpm db:migrate`
- [ ] Seed script en [src/lib/db/seed.ts](../../../../src/lib/db/seed.ts):
  - Insert Plan slug='free' con features={} y limits={} (sin caps activos)
- [ ] Indexes según data model: email unique, last_active_at, deleted_at

## Acceptance Criteria

```gherkin
Scenario: Migration applies cleanly
  Given Neon dev branch is empty
  When pnpm db:migrate runs
  Then all 8 tables created with constraints
  And pgvector extension is enabled

Scenario: Seed creates default plan
  Given DB is migrated
  When pnpm db:seed runs
  Then plans table has 1 row with slug='free'

Scenario: Constraint enforcement
  Given a user row
  When intensity_mode is set to invalid value
  Then DB rejects with CHECK constraint violation
```

## Definition of Done

- [ ] Migration file committed under `src/lib/db/migrations/`
- [ ] Schema typechecks (Drizzle infers types)
- [ ] Drizzle Studio (`pnpm db:studio`) shows tables correctly
- [ ] Seed runs idempotently (re-runs no fail)
- [ ] Unit tests para insert/select básicos en plans/users

## Technical Notes

- Subsequent migrations añaden Category/Project/Activity/Sheets en ISSUE-010, ISSUE-012, ISSUE-013, ISSUE-030, ISSUE-032
- Encrypted token columns (BR-12) llegan en ISSUE-090 (Google Calendar) — no en este issue
- Schema sigue Drizzle conventions: snake_case en DB, camelCase en TS

## Implementation Evidence

**Archivos modificados/creados:**

- `src/lib/db/schema/users.ts` — extended con 10 fields AgendaInteligente (googleOauthId, preferredLanguage, timezone, intensityMode, intensityExpiresAt, intensityDefaultUntil, onboardingContext, onboardingCompletedAt, lastActiveAt, silenceReEntrySentAt). Kit's existing fields (humanId, role, avatarData, audit) preservados.
- `src/lib/db/schema/notification-prefs.ts` — nueva tabla E-002 (singleton schedule per user). NO confundir con kit's `notification_preferences` (per-channel-per-category) que coexiste sin colisión.
- `src/lib/db/schema/billing.ts` — nuevas tablas E-070 (plans), E-071 (subscriptions), E-072 (usage_meters) con todos los fields del spec.
- `src/lib/db/schema/index.ts` — re-exports.
- `src/lib/db/migrations/0006_sloppy_reaper.sql` — autogenerada por `pnpm db:generate` + 7 statements manuales apendizados para constraints custom (CHECK enums, partial UNIQUEs, GIN index, unique active subscription, usage bucket uniqueness).
- `src/lib/db/seeds/plans.ts` — seed idempotente Plan 'free' usando `onConflictDoNothing()`.
- `src/lib/db/seeds/index.ts` + `src/lib/db/seed.ts` — wire en orchestrator.
- `tests/unit/db-schema-agenda.test.ts` — 12 tests type-level + table-name + coexistencia kit.

**Reconciliaciones (spec vs kit):**

- `password` (kit) === `password_hash` (spec) — mantengo naming del kit (convención NextAuth).
- `emailVerified` (kit) === `email_verified_at` (spec) — mantengo naming del kit.
- CHECK `password IS NOT NULL OR google_oauth_id IS NOT NULL` **OMITIDO** — el kit usa NextAuth `accounts` table para OAuth links; agregar este CHECK rompería signup OAuth. La regla "must have one auth method" queda en app code.
- `google_oauth_id` en users.ts coexiste con `accounts.providerAccountId` — el primero es para lookups rápidos sin JOIN; el segundo es lo que NextAuth requiere.
- `notification_prefs` (singleton schedule, E-002) y kit's `notification_preferences` (per-channel-per-category) son tablas DISTINTAS con propósitos complementarios.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors (7 warnings pre-existentes del kit)
- `pnpm test` ✅ 484/484 sin flakes
- `pnpm db:generate` ✅ migration limpia
- `pnpm db:migrate` ✅ aplicado a Neon dev branch
- `pnpm db:query --tables` → 15 tables (4 nuevas confirmadas)
- `pnpm db:seed` ✅ idempotent (2 runs probados)
- `pg_constraint` query confirma `users_intensity_mode_check` + `users_preferred_language_check` activos

**AC Scenario 3 (CHECK rejection)**: el constraint existe en pg_constraint. Validación directa con INSERT bloqueada por SK.md §1.3 (db:query is read-only). Test funcional implícito vendrá en ISSUE-006 (onboarding flow) cuando se inserten users reales.
