---
id: ISSUE-005
title: Multi-tenant scopedDb helper + ESLint custom rule + multi-tenant tests
epic: EPIC-AUTH
milestone: v1.0
priority: P0
story_points: 3
status: ready
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
- Future v1.5: consider Postgres RLS as defense-in-depth (already planned in ADR-010)
