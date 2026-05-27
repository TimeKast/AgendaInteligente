---
id: ISSUE-040
title: Goal schema + CRUD + scope enum (quarter/year/5year/life)
epic: EPIC-GOALS
milestone: v1.0
priority: P1
story_points: 3
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-002, ISSUE-005]
user_stories: [US-040]
features: [FT-040]
screens: [SCR-022, SCR-043]
business_rules: [BR-6]
agents: [backend-specialist]
skills: [/database, /backend]
entities: [E-010]
---

# ISSUE-040 — Goal entity + CRUD

## Overview

Migration creates `goals` table per E-010. CRUD Server Actions. Scope enum supports 'quarter' | 'year' | '5year' | 'life'. UI in v1 expone solo quarter/year; 5year/life son placeholders v2.

## Tasks

- [ ] Migration: create `goals` table per E-010
  - CHECK `scope IN ('quarter', 'year', '5year', 'life')`
  - CHECK `status IN ('active', 'achieved', 'partial', 'abandoned')`
  - CHECK `review_score IS NULL OR review_score BETWEEN 1 AND 10`
- [ ] Indexes: `(user_id, scope, status)`, `(user_id, deadline)`
- [ ] Server Actions: `createGoal`, `updateGoal`, `deleteGoal`
- [ ] Zod validation:
  - title 1-200, description max 2000
  - scope obligatorio
  - deadline required si scope ∈ {quarter, year}, optional 5year/life
- [ ] UI form (placeholder en goal create modal — completo en ISSUE-043)

## Acceptance Criteria

```gherkin
Scenario: Create quarterly goal
  Given user creates goal { title: "Lanzar MVP", scope: "quarter", deadline: "2026-06-30" }
  Then row inserted con status=active

Scenario: Create yearly goal sin deadline rejected
  Given scope=year + deadline=null
  When createGoal called
  Then 400 validation_failed "deadline requerido para year"

Scenario: Multi-tenant
  Given user A has goal X
  When user B tries to update X
  Then 404 (scopedDb enforced)
```

## Definition of Done

- [x] Migration applied
- [x] CRUD tested
- [x] scopedDb used

## Implementation Evidence

**Archivos NEW:**

- `src/lib/db/schema/goals.ts` — E-010 (15 cols: title, description, scope, deadline, outcome_expected, notes_cost, status, review_score, review_notes, reviewed_at, deleted_at + 4 audit). 2 indexes: `(user_id, scope, status)` y `(user_id, deadline)`. Exporta `GOAL_SCOPES` y `GOAL_STATUSES` constants para reusar como Zod enum source-of-truth.
- `src/lib/db/migrations/0014_puzzling_rafael_vega.sql` — autogen + 3 CHECK manuales (scope IN enum, status IN enum, review_score 1..10 OR NULL).
- `src/lib/validations/goal.ts` — `createGoalSchema` con `superRefine` (deadline required para quarter/year), `updateGoalSchema` (parcial sin deadline-conditional — ver decisiones), `deleteGoalSchema`.
- `src/lib/actions/goal.ts` — `createGoal` / `updateGoal` / `deleteGoal` via `withSelf` + `scopedDb`. Soft-delete idempotente. Auto-stamp `reviewedAt` en primer write de review_score|review_notes (empty string NO cuenta).
- `tests/unit/goal-actions.test.ts` — 24 tests (9 create, 10 update, 4 delete + edges).

**Archivos EDIT:**

- `src/lib/db/scoped.ts` — register `goals` (9 tablas en TENANT_TABLES).
- `src/lib/db/schema/index.ts` — barrel export para que drizzle-kit detecte la tabla.
- `tests/unit/scoped-db.test.ts` — `'goals'` agregado al expected sort de TENANT_TABLES registry.

**Decisiones de diseño:**

- **No state machine en `status`**: a diferencia de Activity (BR-8 matrix), Goal status es libre (user decide cuándo abandonar/marcar achieved). Solo enum membership validate.
- **`deadline` required solo en CREATE**: validar también en UPDATE requiere read-existing + merge (mirror DaySheet). Costo no justificado por el AC. Si flow real revela "year goal perdió su deadline via update", se agrega merge-and-validate.
- **`reviewedAt` stamp-once**: primer write de `review_score` OR `review_notes` (no-empty) → stamp `now()`. Subsequent edits no re-stamp. Empty string en `review_notes` NO cuenta como review (test "does NOT stamp reviewed_at when review_notes is the empty string").
- **Soft-delete idempotente**: `deleteGoal` sobre row ya soft-deleted = no-op (no segundo UPDATE). Test cubre el caso.
- **No GoalLink (E-011) en este PR**: M2M Goal↔Project/Activity es ISSUE-041. Soft-delete cascade a links también queda diferido (FK ON DELETE CASCADE solo dispara en hard-delete).
- **`GOAL_SCOPES` / `GOAL_STATUSES` constants exportados** desde schema: Zod enum los consume directamente — un solo source of truth (cambia el enum → schema + Zod actualizados simultáneamente).
- **5year/life son MVP-ready en schema, UI-deferred a v2**: el schema acepta los 4 scopes desde día 1, evita migration para activar UI v2.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors (7 warnings preexistentes)
- `pnpm db:migrate` ✅ aplicado a Neon dev branch
- `pnpm test goal scoped-db` ✅ 34/34
- `pnpm test` full ✅ **797/797** (sin flake esta corrida)

**Scope deferred:**

- UI form completo (modal de creación + edición) → **ISSUE-043**
- GoalLink (E-011, M2M Goal↔{Project|Activity}) → **ISSUE-041**
- Goal review screen (SCR-022) → **ISSUE-042**
