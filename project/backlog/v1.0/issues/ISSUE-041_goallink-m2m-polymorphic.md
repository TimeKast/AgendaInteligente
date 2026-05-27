---
id: ISSUE-041
title: GoalLink M2M polymorphic + linking UI en Activity/Project detail
epic: EPIC-GOALS
milestone: v1.0
priority: P1
story_points: 3
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-013, ISSUE-040]
follow_ups: [ISSUE-041b]
user_stories: [US-041]
features: [FT-041]
screens: [SCR-040, SCR-041, SCR-043]
business_rules: [BR-6]
agents: [backend-specialist, frontend-specialist]
skills: [/database, /frontend]
entities: [E-011]
components: [CMP-057]
---

# ISSUE-041 — GoalLink M2M

## Overview

Tabla `goal_links` polymorphic (goal_id, target_type, target_id). Server Actions linkGoal/unlinkGoal. UI selector en Activity/Project detail + en Goal detail.

## Tasks

- [ ] Migration: create `goal_links` table per E-011
  - UNIQUE `(goal_id, target_type, target_id)`
  - Index `(target_type, target_id)` for reverse lookup
  - target_type CHECK enum 'project' | 'activity'
  - **NO FK constraint on target_id** (polymorphic — app code enforces)
- [ ] Server Actions:
  - `linkGoal(goalId, targetType, targetId)` con validation que target exists + pertenece al user
  - `unlinkGoal(linkId)` validates ownership via goal_id
  - `listLinkedGoals(targetType, targetId)` returns Goal[]
- [ ] CMP-057 GoalLinkPicker:
  - Multi-select dropdown de goals activos del user
  - Search/filter por title
  - Shows scope chip
  - Tap to link/unlink, optimistic UI
- [ ] Display goals linked en ActivityDetail (sección "Goals vinculados")
- [ ] Display linked activities/projects en GoalDetail (sección "Linked")

## Acceptance Criteria

```gherkin
Scenario: Link activity to goal
  Given goal "Lanzar MVP"
  When user opens activity detail + selects "Lanzar MVP" en goal picker
  Then goal_link row created
  And activity detail shows badge "Lanzar MVP"
  And goal detail shows the activity en linked list

Scenario: Unlink
  Given existing link
  When user taps × en chip
  Then link row deleted

Scenario: Polymorphic integrity
  Given user creates link target_type='activity' target_id='non-existent-uuid'
  Then Server Action validates target exists, returns 404
  No orphan links allowed
```

## Definition of Done

- [x] M2M working bidireccional (linkGoal + listLinkedGoals + reverse via target_idx)
- [x] No orphan links (linkGoal validates target ownership BEFORE insert; soft-deleted targets/goals filtered in listLinkedGoals)
- [x] Tests for polymorphic queries (18 tests cover activity + project paths + cross-tenant guards)

## Implementation Evidence

**Scope split:** original issue covered (a) backend M2M + (b) UI selector (CMP-057) + integration en ActivityDetail/GoalDetail. **Slice A (this PR) ships backend only.** UI (CMP-057 + screen integrations) deferred to **ISSUE-041b** — abre cuando ActivityDetail (ISSUE-013/SCR-041) y GoalDetail (ISSUE-042/SCR-043) screens existan.

**Archivos NEW:**

- `src/lib/db/schema/goal-links.ts` — E-011 (5 cols: id, goal_id FK CASCADE, target_type, target_id, created_at). UNIQUE `(goal_id, target_type, target_id)` para idempotencia. Reverse index `(target_type, target_id)`. Exporta `GOAL_LINK_TARGET_TYPES` const + `GoalLinkTargetType` type.
- `src/lib/db/migrations/0015_famous_rafael_vega.sql` — autogen + 1 CHECK manual `target_type IN ('project','activity')`.
- `src/lib/validations/goal-link.ts` — 3 schemas (link, unlink, list) consumiendo `GOAL_LINK_TARGET_TYPES` como Zod enum source.
- `src/lib/actions/goal-link.ts` — 3 actions via `withSelf`. Cada write valida ownership: (1) goal vía `scopedDb('goals')` con `isNull(deletedAt)`, (2) target polymorphic vía `scopedDb('projects'|'activities')` con `isNull(deletedAt)`.
- `tests/unit/goal-link-actions.test.ts` — 18 tests (link x6: happy + project path + idempotent re-link, ownership x6: goal absent / soft-deleted / activity absent / project absent / invalid targetType / invalid uuid, unlink x4, list x5).

**Archivos EDIT:**

- `src/lib/db/schema/index.ts` — barrel export para que drizzle-kit detecte la tabla.
- `eslint.config.mjs` — allowlist `src/lib/actions/goal-link.ts` (sin `user_id` column en `goal_links`, mismo pattern que `subtask.ts`).

**Decisiones de diseño:**

- **NO `user_id` column en goal_links** (spec E-011 fidelity). Ownership derivada del parent goal — TWO scopedDb lookups por write para enforce isolation antes de cualquier `db.*` raw.
- **NO FK en `target_id`** (polymorphic). Trade-off documentado: hard-delete del project/activity deja link huérfano. Mitigación: `listLinkedGoals` filtra `isNull(deletedAt)` del target ANTES de consultar links, y soft-deleted goals quedan ocultos via `scopedDb` filter. Purge cron futuro barre huérfanos reales tras hard-delete.
- **`linkGoal` idempotente**: `ON CONFLICT DO NOTHING.returning()` + fallback SELECT por el link existente. UI puede re-link sin temer duplicates, recibe siempre un id estable.
- **`unlinkGoal` con `linkId` (no triplet)**: UI guarda el id al render, no recomputa. Más simple + permite borrar links incluso si el goal está soft-deleted (caso edge: user soft-deleta goal por error, quiere limpiar links antes de undelete).
- **Cross-tenant unlink**: read link → verify parent goal via scopedDb → si goal no es nuestro → 404 (enumeration-safe; no diferenciamos "no existe" vs "no es tuyo").
- **`listLinkedGoals` target-ownership-first**: si el `targetId` no es nuestro, retornamos 404 ANTES de hacer el JOIN. Previene goal leak via foreign-target enumeration.
- **Hard-delete del link** (no soft-delete): un link es relación, no entidad con historia. DELETE row directo.
- **No cascade cleanup en `deleteGoal`** (ISSUE-040): soft-delete del goal NO dispara FK CASCADE — los goal_links se mantienen pero quedan ocultos via filter de `listLinkedGoals`. Hard-delete (cron purge) sí dispara CASCADE → links se barren. Cero código aquí.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors
- `pnpm db:migrate` ✅ aplicado a Neon dev branch
- `pnpm test goal-link` ✅ 18/18
- `pnpm test` full ✅ 811/811 + 4 known flakes (onboarding/super-admin/RegisterForm/register POST) que pasan en isolation 48/48 — pattern preexistente desde ISSUE-004 en Windows + paralelo.

**Scope deferred → ISSUE-041b:**

- CMP-057 GoalLinkPicker (multi-select dropdown con search + scope chip).
- Integración bidireccional en ActivityDetail (sección "Goals vinculados") y GoalDetail (sección "Linked activities/projects").
- Optimistic UI + toast "Vinculado/Desvinculado" con undo.
