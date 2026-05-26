---
id: ISSUE-012
title: Project schema + CRUD + status transitions
epic: EPIC-ORG
milestone: v1.0
priority: P0
story_points: 3
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-010]
user_stories: [US-013, US-014]
features: [FT-011]
screens: [SCR-041]
business_rules: [BR-3]
agents: [backend-specialist, frontend-specialist]
skills: [/database, /backend, /frontend]
entities: [E-004]
---

# ISSUE-012 — Project CRUD + status

## Overview

Implement Project entity, Server Actions, and project detail screen (SCR-041). Support status transitions (active ↔ paused, active → completed/killed).

## Tasks

- [ ] Migration: create `projects` table per E-004
  - FK `category_id ON DELETE RESTRICT`
  - `status CHECK IN ('active','paused','completed','killed')`
  - UNIQUE `(user_id, is_inbox) WHERE is_inbox = true`
- [ ] Server Actions: `createProject`, `updateProject`, `transitionProjectStatus(id, newStatus, reason?)`, `deleteProject`
- [ ] Project detail screen (SCR-041) con:
  - Header: name + category + status badge
  - Deadline + outcome_expected
  - Activity count + list
  - Status change dropdown
- [ ] Inbox project auto-created en signup (referenced by ISSUE-006)
- [ ] Status transition validation: killed/completed require confirmation; killed needs optional reason

## Acceptance Criteria

```gherkin
Scenario: Create project under category
  Given user has "Personal" category
  When she creates project "Side hustle" with deadline "2026-09-30"
  Then project row inserted con category_id, status=active

Scenario: Status transition
  Given project status=active
  When user changes to "paused"
  Then status updated; activities count badge changes

Scenario: Inbox is read-only
  Given Inbox project (is_inbox=true)
  When user tries to delete or rename
  Then UI blocks; API returns 403

Scenario: Project deletion cascades to activities
  Given project with 5 activities
  When user deletes (with cascade confirmation)
  Then project + 5 activities soft deleted
```

## Definition of Done

- [ ] CRUD + transitions tested
- [ ] Status badges styled per `--scope-*` y status (active=normal, paused=hint, completed=success, killed=ink-soft)
- [ ] Project detail layout responsive (mobile single col, desktop sidebar)

## Implementation Evidence

**Archivos:**

- `src/lib/db/schema/projects.ts` — E-004 (13 columns, FK users CASCADE + category RESTRICT). Export `PROJECT_STATUSES` const tipado.
- `src/lib/db/schema/index.ts` — re-export.
- `src/lib/db/scoped.ts` — `projects` registrada (5 tablas en TENANT_TABLES).
- `src/lib/db/migrations/0008_long_red_wolf.sql` — autogen + 3 statements manuales: CHECK status enum, 2 partial UNIQUEs (`(user_id) WHERE is_inbox`, `(user_id, category_id, name) WHERE deleted_at IS NULL`).
- `src/lib/validations/project.ts` — 4 schemas: create / update / transition / delete. `transitionProjectStatusSchema` con enum status + reason opcional.
- `src/lib/actions/project.ts` — 4 actions: `createProject`, `updateProject`, `transitionProjectStatus`, `deleteProject`. Inbox bloqueado a nivel API. `completed_at` auto-managed.
- `tests/unit/project-actions.test.ts` — 19 unit tests.
- `tests/unit/category-actions.test.ts` — refactor `vi.hoisted` para mock state.
- `tests/unit/scoped-db.test.ts` — actualizado (5 tablas en registry).

**Decisiones de diseño:**

- **Status matrix permisiva**: cualquier transición está permitida. La UX decide qué moves exponer; el data layer no impone el grafo. Simplifica la lógica y permite re-open (completed → active) sin matrices custom.
- **`completed_at` auto-managed**: server action setea/clears según transitions. status → 'completed' setea `now()`; leaves 'completed' clears NULL.
- **`reason` en kill — logged-not-persisted**: el schema E-004 no tiene columna `kill_reason`. El `reason` se acepta en el Zod schema y se loguea via `logger.info` para telemetry + agent context, pero no se persiste. Si en futuro se decide persistirlo, agregar columna `kill_reason text NULL` con migration aditiva.
- **`ON DELETE RESTRICT` en category_id**: defensa contra `DELETE FROM categories` accidentales. NO dispara en soft-delete (que solo setea `deletedAt`). El check "no borrar categoría con proyectos activos" vive en app code y llega en ISSUE-011.

**Bug fix bonus — flakiness en tests**:
Refactor de ambos `category-actions.test.ts` y `project-actions.test.ts` con `vi.hoisted()` para el state del mock de `scopedDb`. El pattern original (state module-level capturado en closure) causaba bleed entre archivos en parallel workers de vitest — la suite completa fallaba con ~3/535 tests randomly. Con `vi.hoisted`, cada archivo tiene state aislado en su propia hoist phase. **Suite 535/535 estable en 2 runs consecutivos.**

**Edge cases tested (19):**

- Create con duplicate name en misma category → bloqueado
- Create con duplicate name en DIFERENTE category → permitido (uniqueness es per-category)
- Create con deadline malformado → Zod rechaza
- Update permite mover de categoría si no hay collision en target
- Update bloquea mover si target tiene mismo name
- Update no-op cuando no fields
- TransitionProjectStatus: completed setea completed_at, re-open clears
- TransitionProjectStatus: no-op si status no cambia
- TransitionProjectStatus: kill reason logueado pero no en update payload
- TransitionProjectStatus: Inbox bloqueado
- TransitionProjectStatus: status inválido → Zod rechaza
- Delete: soft-delete, Inbox bloqueado, idempotent

**Scope deferred:**

- UI wiring (`/projects/[id]`, status badges, responsive layout) → ISSUE-006
- Cascade delete a activities → ISSUE-011 (activities llega en ISSUE-013)
- Playwright tests → cuando UI wirea con actions

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors
- `pnpm test` full ✅ 535/535 (2 runs sin flakes)
- `pnpm test project-actions + category-actions + scoped-db` ✅ 44/44
- `pnpm db:migrate` ✅
- `pg_constraint`: 4 constraints (pkey, 2 FK, CHECK status)
