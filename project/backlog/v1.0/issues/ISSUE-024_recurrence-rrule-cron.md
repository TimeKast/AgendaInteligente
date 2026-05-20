---
id: ISSUE-024
title: Recurrence RRULE input + cron materialization 14 días adelante
epic: EPIC-TIME
milestone: v1.0
priority: P2
story_points: 5
status: ready
dependencies: [ISSUE-013, ISSUE-020]
user_stories: [US-025]
features: [FT-026]
screens: [SCR-040]
business_rules: [BR-11, OPS-5]
agents: [backend-specialist]
skills: [/backend, /database]
---

# ISSUE-024 — Recurrence

## Overview

Implement recurrence_rule (RRULE string). Cron materializa próximas 14 instancias de cada recurring activity. Each instance es una row separada con `recurrence_parent_id`.

## Tasks

- [ ] UI: recurrence picker en activity form
  - Presets: "diaria" / "semanal" (specific días) / "mensual día del mes" / "custom RRULE"
  - For "L-V" preset → RRULE: `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`
- [ ] Use `rrule` library para parse + expand
- [ ] Inngest function `recurrence.materialize.daily`:
  - For each activity con recurrence_rule, expand RRULE next 14 días
  - INSERT missing instances con `recurrence_parent_id = parent.id`
  - Skip instances que ya existen (idempotent)
- [ ] Domain function en [src/lib/domain/recurrence.ts](../../../../src/lib/domain/recurrence.ts) con tests unitarios
- [ ] Edit recurring activity:
  - "Cambiar solo esta instancia" vs "cambiar todas las próximas" decision UI
  - Para esta v1, mantener simple: cambiar solo esta instancia (single row); cambios al parent regeneran future con merge careful
- [ ] Delete recurring activity: prompt "borrar solo esta o también próximas?"

## Acceptance Criteria

```gherkin
Scenario: Weekly recurrence
  Given user creates activity "Gym" con preset L-W-V
  Then RRULE stored: "FREQ=WEEKLY;BYDAY=MO,WE,FR"
  And cron materializes ~6 instances en próximos 14 días

Scenario: Idempotent materialization
  Given recurrence already materialized
  When cron runs again
  Then no duplicate instances created

Scenario: Skip instance
  Given recurring "Gym" lunes 19 mayo
  When user marks it skipped
  Then only that instance affected; martes/miércoles/etc unchanged

Scenario: DST transition
  Given recurring weekly activity straddling DST change
  Then instances created correctly at user's local time
```

## Definition of Done

- [ ] rrule library integrated
- [ ] Inngest cron tested
- [ ] DST edge case tested
- [ ] Performance: materialization < 5s para user con 50 recurring
