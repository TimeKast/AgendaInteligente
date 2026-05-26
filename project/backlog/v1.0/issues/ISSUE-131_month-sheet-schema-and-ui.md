---
id: ISSUE-131
title: MonthSheet schema (E-026) + pantalla `/month` con grid + month picker
epic: EPIC-SHEETS
milestone: v1.0
priority: P1
story_points: 8
status: ready
dependencies: [ISSUE-002, ISSUE-013, ISSUE-032, ISSUE-134]
user_stories: [US-131]
features: [FT-131]
screens: [SCR-026]
business_rules: [BR-7, BR-19]
agents: [backend-specialist, frontend-specialist]
skills: [/database, /backend, /frontend]
entities: [E-026]
components: [CMP-132, CMP-133]
---

# ISSUE-131 — MonthSheet schema + `/month`

## Overview

Implementa entidad MonthSheet (E-026) y la pantalla `/month`. Planning mensual ligero análogo a WeekSheet, con grid mensual de activities y MonthSheet con "una cosa del mes", themes y close summary.

## Tasks

- [ ] Migration: crear `month_sheets` table per E-026
  - `id uuid pk`
  - `user_id uuid NOT NULL FK → users.id ON DELETE CASCADE`
  - `month_starting date NOT NULL` — siempre día 1 del mes en TZ del user (BR-19)
  - `goals text NULL`
  - `themes text[] NOT NULL DEFAULT '{}'` — 3-5 temas
  - `close_summary text NULL`
  - `closed_at timestamptz NULL`
  - audit fields (`created_at`, `updated_at`)
  - UNIQUE `(user_id, month_starting)` — BR-7 extendido a month
  - CHECK `EXTRACT(DAY FROM month_starting) = 1` — BR-19
- [ ] Helper `getOrCreateMonthSheet(userId, monthStarting)` con normalización (forzar día 1)
- [ ] Server actions: `updateMonthSheet`, `closeMonth`
- [ ] Ruta `app/(agendaInteligente)/month/page.tsx`
- [ ] CMP-132 `MonthGrid`:
  - Calendar grid 7×5 (o 7×6) con `MonthDayCell` por día
  - Cada celda: número de día + count de activities scheduled + dot indicators por proyecto principal (top 3 proyectos por count, con su color)
  - Month picker (mes/año) arriba con navegación ← / →
- [ ] `MonthDayCell` interactividad:
  - Tap → abre `DayActivitiesSheet` con activities de ese día (editables inline)
  - Drag-and-drop activity entre días → action `moveActivityDate` (actualiza primer elemento de `scheduled_dates`)
- [ ] CMP-133 `MonthSheetPanel`:
  - "Una cosa del mes" (input single line)
  - "Themes" — chips editables (max 5)
  - Wins mensuales opcionales (max 3) — text inputs
  - "Evitar" — text
  - "Cerrar mes" button → setea `close_summary` + `closed_at`
- [ ] Botón "Congelar plan mensual" → ver ISSUE-141 (PlanSnapshot month scope)

## Acceptance Criteria

```gherkin
Scenario: Auto-normalize month_starting (BR-19)
  Given server action createMonthSheet(userId, 2026-05-15)
  Then row persiste con month_starting = 2026-05-01 (normalizado a día 1)

Scenario: UNIQUE constraint (BR-7 extendido)
  Given MonthSheet existe para (userA, 2026-05-01)
  When INSERT directo duplicado
  Then UNIQUE violation

Scenario: Grid muestra activities
  Given user con 12 activities scheduled en mayo 2026
  When abre /month?m=2026-05
  Then grid muestra cada día con su count
  Day 19 con 3 activities muestra "3" + 3 dots de color por proyecto

Scenario: Drag activity entre días
  Given activity scheduled en día 19
  When user arrastra a día 22
  Then action updateActivity llamada con scheduled_dates = ['2026-05-22']
  Grid actualiza

Scenario: Tap día abre sheet
  Given día 19 con 3 activities
  When tap
  Then DayActivitiesSheet abre con lista editable

Scenario: MonthSheet "una cosa del mes"
  Given user edita campo "Una cosa del mes" = "Lanzar v1"
  Then save persiste en goals (single-line) o campo dedicado

Scenario: Component test (RTL)
  Given mock con 5 activities en mayo
  When drag activity de día 19 a día 22
  Then action updateActivity llamada con scheduled_dates correcta
```

## Definition of Done

- [ ] Migration aplicada y reversible
- [ ] BR-19 enforced (CHECK + Zod refine + server action normaliza)
- [ ] BR-7 extendido a month con UNIQUE
- [ ] `/month` responsive mobile 375px + desktop
- [ ] Drag-and-drop con feedback visual
- [ ] Component test (RTL) cubre drag + tap-day + edit MonthSheet (≥ 3 tests)
- [ ] Performance: render < 200ms para mes con 50 activities
