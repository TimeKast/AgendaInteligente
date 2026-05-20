---
id: ISSUE-034
title: Friday cron — materialize next WeekSheet (OPS-7)
epic: EPIC-SHEETS
milestone: v1.0
priority: P1
story_points: 2
status: ready
dependencies: [ISSUE-032]
user_stories: [US-033]
features: [FT-034]
screens: []
business_rules: [BR-7, OPS-7]
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-034 — Friday cron materializes next WeekSheet

## Overview

Inngest cron Viernes pre-create empty WeekSheet for next week so that Sunday kickoff (FLW-006) tiene row ya disponible.

## Tasks

- [ ] Inngest function `weekly.materialize.next` triggered Fridays at midnight UTC (Saturday for users en east TZs)
- [ ] For each active user (not deleted, not muted indefinitely): create WeekSheet for week_starting = next Sunday in user TZ
- [ ] Idempotent: if already exists, skip
- [ ] Domain helper `getNextWeekStarting(now, userTimezone)` retorna next Sunday correctamente
- [ ] Telemetry: count created vs skipped per run

## Acceptance Criteria

```gherkin
Scenario: Friday job creates next WeekSheet
  Given alice's TZ = America/Mexico_City
  When cron runs Viernes
  Then WeekSheet row created con (alice.id, next Sunday's date)
  And all kickoff/review fields = NULL

Scenario: Idempotent
  Given WeekSheet already exists
  When job runs again
  Then no duplicate, no error

Scenario: Deleted user skipped
  Given user con deleted_at set
  Then job skips that user
```

## Definition of Done

- [ ] Inngest function tested locally
- [ ] Tested for users en distintos TZs
- [ ] Documented en runbook for ops
