---
id: ISSUE-139
title: CloseDayModal — outcome per-activity + close_summary (reemplaza flow conversacional)
epic: EPIC-SHEETS
milestone: v1.0
priority: P0
story_points: 5
status: ready
dependencies: [ISSUE-013, ISSUE-030, ISSUE-137]
user_stories: [US-031b]
features: [FT-031]
screens: [SCR-060]
business_rules: [BR-17]
agents: [frontend-specialist, backend-specialist]
skills: [/frontend, /backend]
components: [CMP-142]
---

# ISSUE-139 — CloseDayModal (close-day flow simplificado)

## Overview

Implementa SCR-060 — el modal `CloseDayModal` que reemplaza el flow conversacional evening (FLW-005 deprecated). Por cada activity con `today ∈ scheduled_dates`, el user elige outcome (Hecha / Avanzada / No la toqué) y al final escribe un one-liner `close_summary`. Reemplaza evening_win + evening_lesson + tomorrow_top + insight con un solo campo.

> Trigger: push al `evening_time` o tap "Cerrar día" desde Today. Flow analogous a US-031b.

## Tasks

- [ ] CMP-142 `CloseDayModal`:
  - Header: "Cerrar día — [fecha]"
  - Lista de activities del día (filtradas por `today = ANY(scheduled_dates)`)
  - Por cada activity row:
    - Title + project chip
    - 3 radio options en línea: "Hecha y cerrada" / "Avanzada" / "No la toqué"
    - Si "Avanzada" → ProgressSlider (CMP-140 — ISSUE-137) aparece animated debajo
  - Section "Resumen del día" (textarea max 280 chars con counter)
  - Submit button "Guardar cierre"
- [ ] Server action `closeDay({ date, activityOutcomes: [{activityId, outcome, progressPercent?}], closeSummary })`:
  - Por cada outcome, dispatch a `setActivityOutcome` (ISSUE-137)
  - Update DaySheet con `close_summary` y `evening_completed_at = now()`
  - Validate: closeSummary max 280 chars
  - Transactional: si falla un outcome, rollback todo
- [ ] Empty state: si no hay activities scheduled hoy → modal solo muestra textarea `close_summary` (no skip de modal entero)
- [ ] NO incluir sección "wins de hoy" separada (los wins ya viven en `DaySheet.wins_planned` del morning; outcome individual los cierra)
- [ ] NO triggerear challenge del agente durante close-day (es modal estructurado, no chat). Si user activa "Pedir feedback del agente" → flow opcional posterior abre chat (out of scope este issue)

## Acceptance Criteria

```gherkin
Scenario: Cierre normal con 3 activities
  Given user con 3 activities scheduled hoy
  When abre CloseDayModal
  Then 3 rows con radio "Hecha/Avanzada/No la toqué" cada uno

Scenario: Outcomes mixtos
  Given user marca activity 1 "Hecha", activity 2 "Avanzada" 60%, activity 3 "No la toqué"
  Y escribe "Buen día, drené poco focus por reuniones"
  When submit
  Then:
    - Activity 1: status='done', completed_at=now, progress_percent=100 (BR-17)
    - Activity 2: status='in_progress', progress_percent=60
    - Activity 3: status='skipped'
    - DaySheet: close_summary persistido, evening_completed_at=now

Scenario: Empty day (sin activities)
  Given día sin activities scheduled
  When abre modal
  Then solo aparece textarea close_summary
  Submit válido con solo close_summary

Scenario: Validation close_summary 280 chars
  Given close_summary = string 290 chars
  Then 400 validation_failed con hint "max 280"

Scenario: Transactional rollback
  Given submit con 3 outcomes y uno falla (e.g., progress_percent=150 en outcome 2)
  Then ningún outcome persiste, ningún cambio en DaySheet
  Error message visible

Scenario: NO sección wins separada (regression guard)
  Given DOM del modal
  Then no existe sección "Wins de hoy" con input separado

Scenario: Component test (RTL)
  Given mock con 2 activities
  When user marca outcomes diferentes para cada una + escribe summary + submit
  Then action closeDay llamada con payload correcto (2 outcomes + summary)
  Modal cierra al success
```

## Definition of Done

- [ ] CMP-142 implementado per SCR-060 wireframe
- [ ] Server action `closeDay` con transactional behavior
- [ ] Component test (RTL) ≥ 3 (cierre normal, empty day, validation summary length)
- [ ] Reemplaza CMP-061 (legacy evening flow) — marcar deprecated
- [ ] Mobile 375px scroll-friendly cuando hay 10+ activities
- [ ] Empty state UI explícito
- [ ] BR-17 enforced (Hecha force progress_percent=100)
