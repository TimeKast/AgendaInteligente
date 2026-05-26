---
id: ISSUE-015
title: Subtask (1 nivel max) schema + inline UI en activity detail
epic: EPIC-ORG
milestone: v1.0
priority: P1
story_points: 2
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-013, ISSUE-014]
user_stories: [US-017]
features: [FT-013]
screens: [SCR-040]
business_rules: [BR-5]
agents: [backend-specialist, frontend-specialist]
skills: [/database, /frontend]
entities: [E-006]
components: [CMP-054]
---

# ISSUE-015 — Subtasks (1 level)

## Overview

Add Subtask entity (BR-5: max 1 level, no recursion). UI inline en ActivityDetail. Marking all subtasks done sugiere marcar Activity como done.

## Tasks

- [ ] Migration: create `subtasks` table per E-006
  - FK `activity_id ON DELETE CASCADE`
  - No `parent_subtask_id` column (structural prevention de recursion)
- [ ] Server Actions: `createSubtask`, `toggleSubtask`, `deleteSubtask`, `reorderSubtasks(activityId, ids)`
- [ ] CMP-054 SubtaskList component en ActivityDetail (SCR-040)
- [ ] No "+ subtask" en subtask UI (estructuralmente imposible añadir nested)
- [ ] When all subtasks done → toast "¿Marcar [actividad] como hecha?" con CTA inline

## Acceptance Criteria

```gherkin
Scenario: Add subtasks
  Given activity "Llamar a Juan"
  When user adds 2 subtasks
  Then they appear listed con checkbox

Scenario: Schema prevents recursion
  Given subtask schema
  When code attempts to add parent_subtask_id field
  Then schema rejects (structural — no column exists)

Scenario: All subtasks done suggestion
  Given activity con 3 subtasks all done
  When the last one is checked
  Then toast suggests "¿Marcar 'Llamar a Juan' como hecha?"
  When user confirms
  Then activity status → done
```

## Definition of Done

- [ ] Migration applied
- [ ] UI tested mobile + desktop
- [ ] No way to nest subtasks (UI + DB)
- [ ] Cascade delete works when activity deleted

## Implementation Evidence

**Archivos:**

- `src/lib/db/schema/subtasks.ts` — E-006 (7 columns: id, activityId FK CASCADE, title, status, position, completedAt, createdAt). Structural prevention de recursion: NO `parent_subtask_id` column. Exports `SUBTASK_STATUSES = ['pending','done']`.
- `src/lib/db/migrations/0011_bumpy_cannonball.sql` — autogen + CHECK status enum.
- `src/lib/validations/subtask.ts` — 4 schemas (create/toggle/delete/reorder); todos incluyen `activityId` para que el server verifique ownership.
- `src/lib/actions/subtask.ts` — 4 actions + helper `requireOwnedActivity(userId, activityId)` que usa `scopedDb('activities')` antes de cualquier subtask CRUD.
- `eslint.config.mjs` — `actions/subtask.ts` allowlisted (subtasks no en TENANT_TABLES por diseño).
- `tests/unit/subtask-actions.test.ts` — 15 tests.

**Decisión de scoping (E-006 fidelity):**

Subtasks son la única entidad tenant-aware **sin `user_id` column**. El spec E-006 deliberadamente no la incluye — la jerarquía es Activity → Subtask, y multi-tenant se enforce a través de Activity ownership. Implementé el pattern:

1. Action recibe `activityId` (siempre obligatorio en el Zod schema).
2. `requireOwnedActivity(userId, activityId)` valida vía `scopedDb('activities').select(eq(activities.id, activityId))` que la activity pertenece al user. Si no → "Actividad no encontrada" (mismo mensaje genérico que cualquier not-found para anti-enumeration).
3. Subtask CRUD usa `db` directo con `eq(subtasks.activityId, activityId)` explícito en cada WHERE.
4. ESLint allowlist en `subtask.ts` (scopedDb registry no aplica).

Alternativa rechazada: denormalizar `user_id` en subtasks (más simple, fácil de mantener sync con activity owner, integra con scopedDb registry). Spec fidelity ganó — la columna no aporta valor más allá de la convención del scopedDb pattern.

**"All subtasks done" UX:**

`toggleSubtask` retorna `{ allSubtasksDone: boolean, newStatus: 'pending'|'done' }`. La UI consume el flag para mostrar toast "¿Marcar [activity] como hecha?" con CTA que llama `transitionActivity({ id, toStatus: 'done' })`. NO marca activity done automáticamente — user agency.

**Recursion prevention (3 capas):**

1. **Estructural**: schema no tiene `parent_subtask_id` column.
2. **TypeScript**: `NewSubtask` no expone ningún campo para padre subtask.
3. **API**: `createSubtask` solo acepta `activityId` (UUID de Activity, NO de Subtask).

**Cobertura tests (15):**

- createSubtask: ownership rejection, position=0 sin siblings, max+1 con siblings, empty title rejection.
- toggleSubtask: pending→done con allSubtasksDone=true, done→pending con allSubtasksDone=false, partial done state, cross-activity subtask rejection, parent ownership rejection.
- deleteSubtask: hard delete scoped, ownership rejection.
- reorderSubtasks: atomic positions 0/1/2 en tx, cross-activity id rejection, dup ids Zod, single-element Zod.

**Scope deferred:**

- UI inline (CMP-054 SubtaskList en SCR-040) → ISSUE-014
- E2E test → cuando UI wired
- Toast "¿Marcar activity como hecha?" → UI side, llama `transitionActivity` ya existente

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors (BR-1 allowlist correcta)
- `pnpm test subtask-actions` ✅ 15/15
- `pnpm test` full ✅ 636/636 (en re-run; 1 run con 2 timeouts pre-existentes super-admin + register, no relacionados)
- `pnpm db:migrate` ✅ aplicado a Neon dev branch
