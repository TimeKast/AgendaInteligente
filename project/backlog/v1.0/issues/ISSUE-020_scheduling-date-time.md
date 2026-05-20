---
id: ISSUE-020
title: scheduled_date + scheduled_time inputs + DatePicker quick-picks
epic: EPIC-TIME
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-013, ISSUE-014]
user_stories: [US-020, US-021]
features: [FT-020, FT-021]
screens: [SCR-040, SCR-051]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-015, CMP-016]
---

# ISSUE-020 — Scheduling date + time

## Overview

Expose scheduled_date y scheduled_time fields en UI. Build CMP-015 DatePicker con quick-picks ("Hoy", "Mañana", "Esta semana"). CMP-016 TimePicker opcional.

## Tasks

- [ ] CMP-015 DatePicker:
  - Mobile: native `<input type="date">` con custom CSS
  - Quick-picks visibles: "Hoy" / "Mañana" / "Próximo lunes" / "Esta semana" (pool)
  - "Esta semana" sets scheduled_date = null + week_starting = current Sunday (TODO en sheets integration)
  - Desktop: shadcn/ui calendar opcional
- [ ] CMP-016 TimePicker:
  - Mobile: native `<input type="time">`
  - Optional toggle: "Sin hora específica" to clear scheduled_time
- [ ] Activity quick-add includes date picker compact
- [ ] Activity detail includes both pickers
- [ ] Display: anchored task (scheduled_time NOT NULL) en time slot order; pool tasks (scheduled_time NULL) en time_block group (en ISSUE-021/025)

## Acceptance Criteria

```gherkin
Scenario: Quick pick "Mañana"
  Given user creating activity en lunes
  When she taps "Mañana"
  Then scheduled_date = tuesday's date in user TZ

Scenario: Anchor a time
  Given activity sin time
  When user taps time picker + selects "10:00"
  Then scheduled_time = "10:00"
  And en Today view appears bajo "MAÑANA" section ordered by time

Scenario: Clear time
  Given activity con scheduled_time = "10:00"
  When user taps "Sin hora específica"
  Then scheduled_time = null
  And activity moves to pool (anytime) en today's display

Scenario: Pool task ("esta semana")
  Given user picks "Esta semana"
  Then scheduled_date = null (or assigned to a default day, configurable)
  And activity appears en Week pool section, no día específico
```

## Definition of Done

- [ ] Quick-picks tested per locale (es-MX TZ handling)
- [ ] DST edge cases tested
- [ ] Native pickers work iOS Safari + Android Chrome
