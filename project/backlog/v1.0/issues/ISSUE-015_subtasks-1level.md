---
id: ISSUE-015
title: Subtask (1 nivel max) schema + inline UI en activity detail
epic: EPIC-ORG
milestone: v1.0
priority: P1
story_points: 2
status: ready
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
