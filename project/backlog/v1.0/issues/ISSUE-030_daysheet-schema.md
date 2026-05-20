---
id: ISSUE-030
title: DaySheet schema + getOrCreate helper (BR-7) + UNIQUE constraint
epic: EPIC-SHEETS
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-002]
user_stories: [US-030]
features: [FT-030]
screens: [SCR-020]
business_rules: [BR-7]
agents: [backend-specialist]
skills: [/database, /backend]
entities: [E-020]
---

# ISSUE-030 — DaySheet schema + getOrCreate

## Overview

Migration adds DaySheet table con UNIQUE constraint (BR-7). Implement `getOrCreateDaySheet(userId, date)` con atomic upsert. Domain helpers para calcular completion timestamps.

## Tasks

- [ ] Migration: create `day_sheets` table per E-020
  - UNIQUE `(user_id, date)`
  - CHECK constraints en energy fields BETWEEN 1 AND 5
  - CHECK `array_length(wins_planned, 1) <= 3 OR wins_planned IS NULL`
- [ ] Helper [src/lib/db/queries/sheets.ts](../../../../src/lib/db/queries/sheets.ts):
  ```ts
  async function getOrCreateDaySheet(userId: string, date: Date): Promise<DaySheet>;
  ```
  Uses `INSERT ... ON CONFLICT (user_id, date) DO NOTHING RETURNING *` o falls back to SELECT
- [ ] Domain helper: `isMorningCompleted(daySheet)` returns true si all morning fields populated (intention + gratitude + identity + ≥1 win + energy 3 set)
- [ ] Same for `isEveningCompleted`
- [ ] When all morning fields set en una update, auto-set `morning_completed_at = now`

## Acceptance Criteria

```gherkin
Scenario: First access today
  Given no DaySheet exists for user A today
  When getOrCreateDaySheet(A, today) called
  Then new row created y returned

Scenario: Concurrent access
  Given 2 parallel calls a getOrCreateDaySheet(A, today)
  Then exactly 1 row exists (no duplicate)
  Both calls return same row

Scenario: BR-7 enforced
  Given DaySheet exists for (userA, today)
  When direct INSERT attempt con duplicate (userA, today)
  Then UNIQUE constraint violation
```

## Definition of Done

- [ ] Migration applied
- [ ] Helper tested under concurrency
- [ ] Completion timestamps auto-set tested
- [ ] BR-7 enforced at DB level
