---
id: ISSUE-041
title: GoalLink M2M polymorphic + linking UI en Activity/Project detail
epic: EPIC-GOALS
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-013, ISSUE-040]
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

- [ ] M2M working bidireccional (see linked from goal side too)
- [ ] No orphan links (validated at app level)
- [ ] Tests for polymorphic queries
