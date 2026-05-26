---
id: ISSUE-032
title: WeekSheet schema + week_starting helper (Sunday-in-user-TZ)
epic: EPIC-SHEETS
milestone: v1.0
priority: P0
story_points: 3
status: completed
completed_date: 2026-05-26
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

## Implementation Evidence

**Archivos:**

- `src/lib/db/schema/week-sheets.ts` — E-021 (19 cols: kickoff fields + review fields + 4 JSONB shapes con TypeScript types: CalendarBlock, PersonToConnect, SelfCare, ReviewPostMortem).
- `src/lib/db/scoped.ts` — `weekSheets` registrada (8 tablas en TENANT_TABLES).
- `src/lib/db/migrations/0013_breezy_pestilence.sql` — autogen + 2 CHECK manuales (`review_energy BETWEEN 1 AND 10 OR NULL`, `array_length(three_wins) <= 3 OR NULL`). UNIQUE `(user_id, week_starting)` (BR-7) + index DESC.
- `src/lib/domain/week-calc.ts` NEW — pure functions DST-safe:
  - `weekStartingFor(date, tz)` → ISO string del Sunday usando ISO-weekday read en TZ del user.
  - `weekEndingFor(weekStartingStr)` → Saturday (Sunday + 6 días).
- `src/lib/db/queries/sheets.ts` EXTENDED — `getOrCreateWeekSheet(userId, weekStartingStr)` mirror del DaySheet pattern.
- `tests/unit/week-calc.test.ts` NEW — 21 tests.

**Decisiones de diseño:**

- **`weekStartingFor` retorna string (YYYY-MM-DD), no Date**: alinea con la columna `date` y evita TZ comparison bugs cuando el caller pase la string directamente al WHERE.
- **Sunday-as-week-start** (US/LatAm convention). Si futuro requiere ISO-week (Mon-start), un solo cambio en la función.
- **DST-safe via `setUTCDate(+N)` + Intl read**: nunca sumamos 24h numéricos; walk en UTC y resolvemos weekday/date en TZ via `Intl.DateTimeFormat`. Spring-forward y fall-back no shiftean la cadencia.
- **JSONB shapes**: documentadas como TypeScript interfaces (CalendarBlock, PersonToConnect, SelfCare, ReviewPostMortem) y type-hinted via `.$type<>()`. Validación full Zod va en ISSUE-033 (week screen wire).
- **Server action de update deferred**: los JSONB shapes son complejos y benefician de UI real para shape validation.

**Cobertura tests (21):**

- 7-day mapping (Sun-Sat → mismo Sunday).
- Cross-month boundary (3): Mon Jun 1 → Sun May 31, Sat May 30 → Sun May 24, Sun May 31 → itself.
- TZ behavior (2): UTC vs local day boundary, same instant en CST vs CEST.
- DST edges (3): US Pacific spring-forward (Mar 2026), US Pacific fall-back (Nov 2026), Spain CEST→CET (Oct 2026).
- Boundary instants (2): Sat 23:59 local → old week, Sun 00:01 local → new week.
- weekEndingFor (4): basic +6, cross-month, cross-year (Dec 2026 → Jan 2027), leap-year Feb 2028.

**Scope deferred:**

- Server action `updateWeekSheet` con full Zod para JSONB shapes → **ISSUE-033** (week screen).
- Cron `materializeWeekSheet` Friday auto-create + reminder → **ISSUE-034**.
- UI completo SCR-021 → ISSUE-033.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors
- `pnpm test week-calc` ✅ 21/21
- `pnpm test` full ✅ 739/739 (re-run; 1 flake transitorio register-test pre-existente)
- `pnpm db:migrate` ✅ aplicado a Neon dev branch
