---
id: ISSUE-012
title: Project schema + CRUD + status transitions
epic: EPIC-ORG
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-010]
user_stories: [US-013, US-014]
features: [FT-011]
screens: [SCR-041]
business_rules: [BR-3]
agents: [backend-specialist, frontend-specialist]
skills: [/database, /backend, /frontend]
entities: [E-004]
---

# ISSUE-012 — Project CRUD + status

## Overview

Implement Project entity, Server Actions, and project detail screen (SCR-041). Support status transitions (active ↔ paused, active → completed/killed).

## Tasks

- [ ] Migration: create `projects` table per E-004
  - FK `category_id ON DELETE RESTRICT`
  - `status CHECK IN ('active','paused','completed','killed')`
  - UNIQUE `(user_id, is_inbox) WHERE is_inbox = true`
- [ ] Server Actions: `createProject`, `updateProject`, `transitionProjectStatus(id, newStatus, reason?)`, `deleteProject`
- [ ] Project detail screen (SCR-041) con:
  - Header: name + category + status badge
  - Deadline + outcome_expected
  - Activity count + list
  - Status change dropdown
- [ ] Inbox project auto-created en signup (referenced by ISSUE-006)
- [ ] Status transition validation: killed/completed require confirmation; killed needs optional reason

## Acceptance Criteria

```gherkin
Scenario: Create project under category
  Given user has "Personal" category
  When she creates project "Side hustle" with deadline "2026-09-30"
  Then project row inserted con category_id, status=active

Scenario: Status transition
  Given project status=active
  When user changes to "paused"
  Then status updated; activities count badge changes

Scenario: Inbox is read-only
  Given Inbox project (is_inbox=true)
  When user tries to delete or rename
  Then UI blocks; API returns 403

Scenario: Project deletion cascades to activities
  Given project with 5 activities
  When user deletes (with cascade confirmation)
  Then project + 5 activities soft deleted
```

## Definition of Done

- [ ] CRUD + transitions tested
- [ ] Status badges styled per `--scope-*` y status (active=normal, paused=hint, completed=success, killed=ink-soft)
- [ ] Project detail layout responsive (mobile single col, desktop sidebar)
