---
id: ISSUE-040
title: Goal schema + CRUD + scope enum (quarter/year/5year/life)
epic: EPIC-GOALS
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-002, ISSUE-005]
user_stories: [US-040]
features: [FT-040]
screens: [SCR-022, SCR-043]
business_rules: [BR-6]
agents: [backend-specialist]
skills: [/database, /backend]
entities: [E-010]
---

# ISSUE-040 — Goal entity + CRUD

## Overview

Migration creates `goals` table per E-010. CRUD Server Actions. Scope enum supports 'quarter' | 'year' | '5year' | 'life'. UI in v1 expone solo quarter/year; 5year/life son placeholders v2.

## Tasks

- [ ] Migration: create `goals` table per E-010
  - CHECK `scope IN ('quarter', 'year', '5year', 'life')`
  - CHECK `status IN ('active', 'achieved', 'partial', 'abandoned')`
  - CHECK `review_score IS NULL OR review_score BETWEEN 1 AND 10`
- [ ] Indexes: `(user_id, scope, status)`, `(user_id, deadline)`
- [ ] Server Actions: `createGoal`, `updateGoal`, `deleteGoal`
- [ ] Zod validation:
  - title 1-200, description max 2000
  - scope obligatorio
  - deadline required si scope ∈ {quarter, year}, optional 5year/life
- [ ] UI form (placeholder en goal create modal — completo en ISSUE-043)

## Acceptance Criteria

```gherkin
Scenario: Create quarterly goal
  Given user creates goal { title: "Lanzar MVP", scope: "quarter", deadline: "2026-06-30" }
  Then row inserted con status=active

Scenario: Create yearly goal sin deadline rejected
  Given scope=year + deadline=null
  When createGoal called
  Then 400 validation_failed "deadline requerido para year"

Scenario: Multi-tenant
  Given user A has goal X
  When user B tries to update X
  Then 404 (scopedDb enforced)
```

## Definition of Done

- [ ] Migration applied
- [ ] CRUD tested
- [ ] scopedDb used
