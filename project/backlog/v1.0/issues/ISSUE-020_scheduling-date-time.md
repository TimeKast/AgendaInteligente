---
id: ISSUE-020
title: scheduled_dates (array) + scheduled_time inputs + DatePicker quick-picks + duration anchor
epic: EPIC-TIME
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-013, ISSUE-014]
user_stories: [US-020, US-021]
features: [FT-020, FT-021]
screens: [SCR-040, SCR-051]
business_rules: [BR-15, BR-16]
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-015, CMP-016]
---

# ISSUE-020 — Scheduling date + time (single-day path)

## Overview

Expone `scheduled_dates` y `scheduled_time` (+ `duration_minutes` cuando anchored) en UI **para el caso single-day** (0 o 1 fecha). El caso multi-día (N fechas explícitas) vive en su propio issue (ver ISSUE-136-NEW, US-136). CMP-015 DatePicker con quick-picks. CMP-016 TimePicker opcional con anchor a grid.

> ⚠️ El array `scheduled_dates` reemplazó el campo single `scheduled_date` (ver ISSUE-013). Esta UI escribe al array con 1 elemento — la UI multi-fecha vive en ISSUE-136-NEW.

## Tasks

- [ ] CMP-015 DatePicker (single-day):
  - Mobile: native `<input type="date">` con custom CSS
  - Quick-picks visibles: "Hoy" / "Mañana" / "Próximo lunes" / "Esta semana" (pool)
  - "Esta semana" sets `scheduled_dates = []` (pool) + asociación lógica al week_starting actual (no escribe fecha hard)
  - Output al payload: `scheduled_dates = [pickedDate]` o `[]` (pool)
  - Desktop: shadcn/ui calendar opcional
- [ ] CMP-016 TimePicker:
  - Mobile: native `<input type="time">`
  - Toggle opcional "Sin hora específica" para limpiar `scheduled_time` Y `duration_minutes` (BR-16)
  - Cuando `scheduled_time` se setea: input `duration_minutes` aparece (default 30 min)
- [ ] Activity quick-add incluye date picker compacto
- [ ] Activity detail incluye ambos pickers + duration
- [ ] Display: anchored task (scheduled_time NOT NULL) en grid horario; pool tasks (`scheduled_dates = []` o `scheduled_time = null`) en sección backlog/pool (ver ISSUE-025)

## Acceptance Criteria

```gherkin
Scenario: Quick pick "Mañana"
  Given user creando activity en lunes
  When tap "Mañana"
  Then scheduled_dates = [tuesday-date-user-TZ]

Scenario: Anchor a time
  Given activity sin time
  When user setea time picker a "10:00" y duration_minutes a 60
  Then scheduled_time = "10:00", duration_minutes = 60
  And en Today grid el bloque aparece de 10:00 a 11:00

Scenario: Clear time (BR-16)
  Given activity con scheduled_time = "10:00" y duration_minutes = 60
  When user tap "Sin hora específica"
  Then scheduled_time = null AND duration_minutes = null
  And activity se mueve al pool

Scenario: Pool task ("esta semana")
  Given user picks "Esta semana"
  Then scheduled_dates = []
  And activity aparece en Week pool section

Scenario: Single-day path escribe 1 elemento
  Given user pickea solo "Mañana"
  Then payload server action recibe scheduled_dates = [oneDate]
  And NUNCA escribe scheduled_date (campo legacy removido en ISSUE-013)
```

## Definition of Done

- [ ] Quick-picks testeados per locale (es-MX TZ handling)
- [ ] DST edge cases testeados
- [ ] Native pickers funcionan en iOS Safari + Android Chrome
- [ ] Component test (RTL): tap "Mañana" → form value scheduled_dates = [tomorrow]; tap "Sin hora específica" → clearea time + duration
- [ ] No referencia al campo legacy `scheduled_date` en el código
