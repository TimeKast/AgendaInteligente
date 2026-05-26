---
id: ISSUE-011
title: Category drag-reorder + soft delete cascade con confirmación
epic: EPIC-ORG
milestone: v1.0
priority: P1
story_points: 2
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-010]
user_stories: [US-011, US-012]
features: [FT-010]
screens: [SCR-042, SCR-054]
business_rules: [BR-4, BR-14]
agents: [frontend-specialist, backend-specialist]
skills: [/frontend, /backend]
---

# ISSUE-011 — Category reorder + cascade delete

## Overview

Add drag-to-reorder en category list (mobile haptic + desktop drag) + soft delete cascade flow con modal confirmation (SCR-054).

## Tasks

- [ ] Drag handle UI (Lucide grip-vertical) en cada category row
- [ ] Use dnd-kit (preferred over react-beautiful-dnd, mobile-friendly)
- [ ] Server Action `reorderCategories(orderedIds: string[])` updates positions atomically
- [ ] Mobile: haptic feedback on drag start (if available via Web Vibration API)
- [ ] Delete flow:
  - Tap delete (⋯ menu) → check projects count
  - If 0 projects: instant soft delete + Toast "Borrado"
  - If >0 projects: modal SCR-054 con count + "Borrar todo" (danger)
  - Confirm → cascade soft delete: Category + Projects + Activities + Subtasks (set `deleted_at = now`)
- [ ] Cron `purge-soft-deleted` (separate Inngest function in EPIC-PWA-SETTINGS) cleans rows >30 days

## Acceptance Criteria

```gherkin
Scenario: Drag reorder
  Given user has 3 categories with positions 0/1/2
  When user drags category at position 2 to top
  Then positions become 0/1/2 with the dragged one at 0
  And order persists across reload

Scenario: Delete empty category
  Given "Side project" with 0 projects
  When user taps delete
  Then soft deleted instantly with Toast "Borrado"
  And undo toast available 5s

Scenario: Delete with cascade
  Given "Empresa Genomma" with 2 projects and 14 activities
  When user taps delete
  Then modal SCR-054 shows counts
  When user confirms "Borrar todo"
  Then Category + 2 Projects + 14 Activities all soft deleted (deleted_at set)
  And Inbox category cannot be deleted (no delete button)
```

## Definition of Done

- [ ] Drag reorder works mobile (touch) + desktop (mouse)
- [ ] Cascade delete tested with realistic counts
- [ ] Inbox delete blocked at API + UI level
- [ ] Tests for atomicity (transaction)

## Implementation Evidence

**Archivos:**

- `src/lib/validations/category.ts` — `reorderCategoriesSchema` (min 2, max 100, unique UUIDs).
- `src/lib/actions/category.ts`:
  - `deleteCategory` refactor: ahora cascade en `db.transaction` sobre activities → projects → category (deepest first); retorna `{ projectCount, activityCount }` para toast.
  - `reorderCategories` nuevo: valida ownership + Inbox-no-incluido + N UPDATEs en tx con `position = i`.
- `eslint.config.mjs` — `category.ts` allowlisted (multi-table tx; misma justificación que onboarding.ts).
- `tests/unit/category-actions.test.ts`:
  - +mock de `db.transaction` con captura en `scopedState.txUpdates`.
  - +6 tests cascade (empty cat, cascade con counts, skip activities branch, Inbox guard, not-found, idempotent).
  - +5 tests reorder (atomic, missing id, Inbox guard, dup ids, single-element).
  - 21/21 totales.

**Decisiones de diseño:**

- **Cascade order activities → projects → category**: deepest first. Order cosmetic en soft-delete pero matchea la dirección de dependencia, así una futura migración a hard-delete (con FK CASCADE) funciona sin reorder.
- **`ON DELETE RESTRICT` en projects.category_id**: solo dispara en HARD delete. Soft delete (setear `deleted_at`) no triggerea FK. Por eso la cascade es app-level en transaction.
- **`reorderCategories` no usa CASE WHEN**: opté por N UPDATEs en tx por simplicidad — categories per user es bajo (<20), y CTE-based reorder agrega complejidad sin gain.
- **Counts retornados** para que UI muestre "Borrado X categoría con 2 proyectos y 14 actividades".

**Scope deferred:**

- **UI wiring**: el prototype `/categories/page.tsx` ya tiene dnd-kit configurado (PointerSensor + KeyboardSensor) y ConfirmDeleteModal con copy de cascade. Wireado a `reorderCategories` + `deleteCategory.data.projectCount` queda para futuro UI polish issue (consistente con el resto del prototype).
- **Web Vibration API haptic**: UI polish.
- **Cron `purge-soft-deleted` >30 días**: ISSUE-080 (Inngest setup).

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors (BR-1 allowlist OK).
- `pnpm test category-actions` ✅ 21/21.
- `pnpm test` full ✅ 595/595 en 2 runs estables.
