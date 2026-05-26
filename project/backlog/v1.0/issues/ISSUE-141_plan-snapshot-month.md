---
id: ISSUE-141
title: PlanSnapshot (scope=month) — extender freeze/viewer al MonthSheet
epic: EPIC-SHEETS
milestone: v1.0
priority: P2
story_points: 3
status: ready
dependencies: [ISSUE-131, ISSUE-140]
user_stories: [US-140, US-141, US-142]
features: [FT-140, FT-141, FT-142]
screens: [SCR-026]
business_rules: [BR-18]
agents: [backend-specialist, frontend-specialist]
skills: [/backend, /frontend]
---

# ISSUE-141 — PlanSnapshot month scope

## Overview

Extiende ISSUE-140 (PlanSnapshot week) para soportar `scope='month'`. Reutiliza el schema, el trigger BR-18 y CMP-143/144. Solo agrega las server actions específicas para month + binding al MonthSheet.

> **Decisión:** se crea como issue separado del week (no extensión inline de ISSUE-140) porque depende de ISSUE-131 (MonthSheet existe) y porque la UI vive en `/month` (distinto al `/week`). Esto permite hacer week-only en sprint A y month en sprint B.

## Tasks

- [ ] Server actions:
  - `freezeMonthPlan(monthSheetId)` → INSERT con `scope='month'`, `reference_id=monthSheetId`, payload con activities de TODO el mes
  - `unfreezeMonthPlan(monthSheetId)`
  - `getMonthSnapshot(monthSheetId)`
  - BR-18 enforced (UNIQUE + trigger ya cubierto en ISSUE-140 migration)
- [ ] Integración en `/month`:
  - Botón "Congelar plan mensual" en `MonthSheetPanel` (CMP-133)
  - Banner persistente análogo al de week
  - Reutiliza CMP-143 `PlanSnapshotControls` con prop `scope='month'`
  - Reutiliza CMP-144 `PlanSnapshotViewer` con prop `scope='month'`
- [ ] Moved-from indicator en `MonthDayCell` y `DayActivitiesSheet`:
  - Si snapshot existe y activity cambió fecha vs snapshot → icon History
  - Aplica a movimientos cross-day Y cross-month (si la activity originalmente estaba en mayo y se movió a junio → indicador visible mientras el snapshot de mayo siga activo)
- [ ] Payload format igual al week, pero con activities filtradas por mes:
  ```sql
  WHERE scheduled_dates && daterange(month_starting, month_starting + interval '1 month')
  ```

## Acceptance Criteria

```gherkin
Scenario: Congelar plan mensual
  Given MonthSheet de 2026-05 sin snapshot
  When user tap "Congelar plan mensual"
  Then action freezeMonthPlan llamada
  Row creado con scope='month'
  Banner aparece en /month

Scenario: BR-18 cross-scope independencia
  Given snapshot week W existente y snapshot month M existente
  Then ambos coexisten (UNIQUE es por scope+reference_id, no global)

Scenario: Moved-from en /month
  Given snapshot mes con activity A en 2026-05-19
  When user drag A en MonthGrid a 2026-05-25
  Then icon History en la celda del 25 (o tooltip al hover)

Scenario: Component test (RTL)
  Given mock con MonthSheet + activities mock
  When user tap "Congelar plan mensual" + confirm
  Then action freezeMonthPlan llamada
  Banner aparece
  When drag activity a otro día
  Then moved-from indicator aparece
```

## Definition of Done

- [ ] 3 server actions month-scope con tests (≥ 3 casos)
- [ ] Reutilización de CMP-143/144 con prop scope (no duplicar código)
- [ ] Moved-from indicator en MonthGrid + DayActivitiesSheet
- [ ] Component test (RTL) ≥ 1 (freeze + moved-from en month)
- [ ] BR-18 verificado en ambos scopes simultáneamente
