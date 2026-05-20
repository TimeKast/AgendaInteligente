---
id: ISSUE-010
title: Category schema + CRUD (Server Actions + UI)
epic: EPIC-ORG
milestone: v1.0
priority: P0
story_points: 3
status: ready
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
