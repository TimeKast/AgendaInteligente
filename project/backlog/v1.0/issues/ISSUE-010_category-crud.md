---
id: ISSUE-010
title: Category schema + CRUD (Server Actions + UI)
epic: EPIC-ORG
milestone: v1.0
priority: P0
story_points: 3
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-002, ISSUE-005]
user_stories: [US-010]
features: [FT-010]
screens: [SCR-042]
business_rules: [BR-3]
agents: [backend-specialist, frontend-specialist]
skills: [/database, /frontend, /backend]
entities: [E-003]
---

# ISSUE-010 — Category CRUD

## Overview

Implement Category entity, migrations, Server Actions (create/update/delete), and the management screen (SCR-042). Auto-create Inbox category at signup (BR-2, partial dependency).

## Tasks

- [ ] Migration: create `categories` table per E-003
  - UNIQUE `(user_id, is_inbox) WHERE is_inbox = true`
  - UNIQUE `(user_id, name) WHERE deleted_at IS NULL`
  - is_inbox = true → name = 'Inbox' (CHECK constraint)
- [ ] Server Actions en [src/lib/actions/category.ts](../../../../src/lib/actions/category.ts): `createCategory`, `updateCategory`, `deleteCategory` (without cascade — eso va en ISSUE-011)
- [ ] Zod schemas en [src/lib/validations/category.ts](../../../../src/lib/validations/category.ts)
- [ ] UI: Category management screen (SCR-042)
  - List view con name + project count + drag handle (drag-reorder ISSUE-011)
  - "+ Nueva categoría" button
  - Inline edit on tap
  - Inbox category shown but not editable/deletable
- [ ] Color picker: 10 predefined colors palette warm-coherent (no neón)
- [ ] Icon picker: subset de Lucide icons (folder, briefcase, heart, user, star, book, ...)

## Acceptance Criteria

```gherkin
Scenario: Create category
  Given user on /categories
  When she taps "+ Nueva" and enters name "Personal" + color
  Then category row inserted with position = max(position) + 1
  And it appears en list

Scenario: Inbox is read-only
  Given Inbox category exists
  When user tries to delete or rename Inbox
  Then UI does not allow it
  And API returns 403 if attempted directly

Scenario: Duplicate name rejected
  Given user has "Personal" category
  When she creates another "Personal"
  Then error "Ya existe esa categoría"
```

## Definition of Done

- [ ] Migration applied
- [ ] CRUD endpoints tested (integration with Neon branch)
- [ ] UI tested via Playwright para create + edit + view
- [ ] scopedDb used throughout
- [ ] Inbox auto-create logic en ISSUE-006 references this table

## Implementation Evidence

**Archivos:**

- `src/lib/db/schema/categories.ts` — E-003 (10 columns, FK users CASCADE).
- `src/lib/db/schema/index.ts` — re-export.
- `src/lib/db/scoped.ts` — `categories` registrada en `TENANT_TABLES`; primer real-world consumer del registry pattern de ISSUE-005. `.select(key, extraWhere?)` ahora acepta filtro adicional opcional (AND-combina con userId), evitando que callers toquen `db` directo para queries con conditions.
- `src/lib/db/migrations/0007_flippant_xavin.sql` — autogen + 4 statements manuales: 2 partial UNIQUEs (`user_id` para inbox, `user_id+name` para activos), 1 CHECK (`is_inbox = false OR name = 'Inbox'`), índice btree para sort.
- `src/lib/validations/category.ts` — Zod schemas con guard contra name = "Inbox" reservado + hex color validator.
- `src/lib/actions/category.ts` — 3 server actions (`createCategory`, `updateCategory`, `deleteCategory`) usando `withSelf` + `scopedDb`. Inbox bloqueado a nivel API con ActionError. Soft delete sin cascade.
- `tests/unit/category-actions.test.ts` — 14 unit tests.
- `tests/unit/scoped-db.test.ts` — actualizado para reflejar 4 tablas en registry.

**Reconciliaciones de scope:**

- **UI wiring deferred a ISSUE-006** — el `/categories/page.tsx` prototype mantiene su useState con hardcoded data hoy. Wiring a server actions requiere auth flow funcional, que llega con onboarding. Cuando ISSUE-006 wire auth, intercambiar useState por Server Component fetcher + onSubmit acciones es trivial.
- **Drag-reorder + cascade delete deferred a ISSUE-011** per el spec del issue.
- **Playwright tests deferred** — requieren UI wireada con auth. Por ahora unit tests cubren la lógica.
- **Inbox auto-create** se delega a ISSUE-006 (onboarding) per el spec; la tabla ya soporta el partial UNIQUE.

**Edge cases tested:**

- Create con name colisionando vs row activo (no soft-deleted) → "Ya existe esa categoría"
- Create con name = "Inbox" → bloqueado por Zod ("reservado para sistema")
- Create con color malformado → bloqueado por Zod
- Update con only `id` (no fields) → no-op, no UPDATE statement
- Update Inbox → "Inbox no se puede editar"
- Update con rename a name existente → bloqueo por collision check
- Delete Inbox → "Inbox no se puede borrar"
- Delete row no-existente → "Categoría no encontrada"
- Delete row ya soft-deleted → idempotent no-op

**ESLint rule BR-1 verificada**: el código nuevo en `category.ts` usa `scopedDb` exclusivamente — la rule no dispara. Battle test exitoso del pattern de ISSUE-005.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors
- `pnpm test` full ✅ 516/516 sin flakes
- `pnpm test category-actions + scoped-db` ✅ 25/25
- `pnpm db:migrate` ✅ aplicado a Neon dev branch
- `pg_constraint` + `pg_indexes` queries confirman: 1 CHECK + 4 indexes (incluyendo 2 partial UNIQUEs)
