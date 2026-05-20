---
id: ISSUE-011
title: Category drag-reorder + soft delete cascade con confirmación
epic: EPIC-ORG
milestone: v1.0
priority: P1
story_points: 2
status: ready
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
