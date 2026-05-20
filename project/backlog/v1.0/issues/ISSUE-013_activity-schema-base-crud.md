---
id: ISSUE-013
title: Activity schema + base CRUD (without time scheduling — eso va en EPIC-TIME)
epic: EPIC-ORG
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-012]
user_stories: [US-015, US-016]
features: [FT-012]
screens: [SCR-040, SCR-051]
business_rules: [BR-2, BR-8]
agents: [backend-specialist]
skills: [/database, /backend]
entities: [E-005]
---

# ISSUE-013 — Activity entity + base CRUD

## Overview

Create Activity entity with all base fields (title, description, project link, priority, status, tags) but without scheduling logic (scheduled_date/time/blocks/recurrence — esos van a EPIC-TIME issues).

## Tasks

- [ ] Migration: create `activities` table per E-005, incluyendo todos los fields (incluso scheduling — solo no expone UI hasta EPIC-TIME)
  - FK `project_id NOT NULL ON DELETE RESTRICT` (BR-2)
  - status CHECK enum
  - priority CHECK BETWEEN 1 AND 5
  - reason_category CHECK enum
  - GIN index on tags
- [ ] Indexes per data model:
  - `(user_id, scheduled_date)` (será usado en EPIC-TIME)
  - `(user_id, status, deadline)`
  - `(user_id, project_id)`
- [ ] Server Actions: `createActivity`, `updateActivity`, `deleteActivity` (no transitions yet — ISSUE-017)
- [ ] Default project_id = user's Inbox project si omitido
- [ ] Zod validation: title 1-200, description max 2000

## Acceptance Criteria

```gherkin
Scenario: Create activity with explicit project
  Given user has project "Side hustle"
  When she creates activity { title: "Plan launch", project_id: side-hustle }
  Then row inserted con priority=3 default, status=pending, tags=[]

Scenario: Default to Inbox
  Given user creates activity without project_id
  When createActivity is called
  Then activity assigned to user's Inbox project

Scenario: Validation
  Given title is empty
  When create called
  Then 400 validation_failed con field=title

Scenario: Project deletion guarded
  Given project P has activities
  When trying to delete P without cascade
  Then RESTRICT prevents (must go through cascade flow ISSUE-011 logic adapted)
```

## Definition of Done

- [ ] Migration applied
- [ ] Server Actions tested
- [ ] No scheduled\_\* fields exposed in UI yet — EPIC-TIME adds them
- [ ] Tags array works correctly with GIN index queries
