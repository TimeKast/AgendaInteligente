---
id: ISSUE-002
title: Drizzle schema + migrations (users, NextAuth tables, plans, subscriptions, usage_meters)
epic: EPIC-AUTH
milestone: v1.0
priority: P0
story_points: 5
status: ready
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
