---
id: ISSUE-032
title: WeekSheet schema + week_starting helper (Sunday-in-user-TZ)
epic: EPIC-SHEETS
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-002]
user_stories: [US-033]
features: [FT-034, FT-035]
screens: [SCR-021]
business_rules: [BR-7]
agents: [backend-specialist]
skills: [/database, /backend]
entities: [E-021]
---

# ISSUE-032 — WeekSheet schema

## Overview

Migration adds WeekSheet table. Helper `weekStartingFor(date, tz)` computes Sunday-in-user-TZ correctly across DST.

## Tasks

- [ ] Migration: create `week_sheets` table per E-021
  - UNIQUE `(user_id, week_starting)`
  - CHECK `review_energy BETWEEN 1 AND 10`
  - CHECK `array_length(three_wins, 1) <= 3 OR three_wins IS NULL`
- [ ] Domain function en [src/lib/domain/week-calc.ts](../../../../src/lib/domain/week-calc.ts):
  ```ts
  function weekStartingFor(date: Date, userTimezone: string): Date {
    // Returns the Sunday of the week containing date, in user TZ
    // Handles DST correctly via Temporal API or date-fns-tz
  }
  ```
- [ ] Helper `getOrCreateWeekSheet(userId, weekStarting)` similar to DaySheet pattern
- [ ] Tests for U-003: DST transitions, edge cases (Saturday midnight, Sunday early morning, etc.)

## Acceptance Criteria

```gherkin
Scenario: Sunday calc Sunday is week_starting
  Given user TZ = America/Mexico_City
  And date = 2026-05-19 (Monday)
  Then weekStartingFor(date, tz) = 2026-05-18 (previous Sunday)

Scenario: Date is Sunday
  Given date = 2026-05-18 (Sunday)
  Then weekStartingFor returns same date (2026-05-18)

Scenario: DST transition week
  Given week straddles DST change (e.g., Mar 9 2026 in some TZ)
  Then weekStartingFor returns valid Sunday without offset shift bug

Scenario: WeekSheet uniqueness
  Given WeekSheet exists for (userA, 2026-05-18)
  When second create attempted
  Then conflict → returns existing
```

## Definition of Done

- [ ] Migration applied
- [ ] week-calc tested with multiple timezones + DST scenarios (U-003)
- [ ] getOrCreate atomic under concurrency
