---
id: ISSUE-024
title: Recurrence DSL simplificado (daily/weekly/monthly) + cron materialización 14 días
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

# ISSUE-024 — Recurrence DSL simplificado

## Overview

Implementa `recurrence_rule` como DSL simplificado (no iCal RRULE completo). Cron materializa próximas 14 instancias de cada recurring activity. Cada instancia se persiste como row separada con `recurrence_parent_id`. Reemplaza el enfoque RRULE estándar adoptado anteriormente — la decisión se simplificó tras iteración prototipo (BR-11 redefinida).

## DSL soportado (v1)

```
daily
weekly:MO,WE,FR          # lista de días en mayúsculas ISO (MO,TU,WE,TH,FR,SA,SU)
monthly:1                # día del mes (1..31)
monthly:last             # último día del mes (calculado por mes)
```

Cualquier otro string → rechazo con `400 invalid_recurrence_rule`.

## Tasks

- [ ] Parser + validator en [src/lib/domain/recurrence.ts](../../../../src/lib/domain/recurrence.ts):
  - `parseRecurrenceRule(s: string): ParsedRule | null`
  - Zod schema custom con `.refine()` que acepta solo los 4 formatos del DSL
  - Tests unitarios (unit layer): casos válidos + casos inválidos (`weekly:XX`, `monthly:32`, `monthly:0`, casos vacíos)
- [ ] UI: recurrence picker en activity form (`RecurrencePicker`):
  - Presets visuales: "Diaria" / "Semanal en días específicos" (chips L-M-X-J-V-S-D) / "Día del mes" (1-31) / "Último día del mes"
  - NO permite ingreso libre de string — solo presets
- [ ] Materializer en Inngest function `recurrence.materialize.daily`:
  - Para cada activity con `recurrence_rule` no nulo, expandir DSL próximos 14 días en TZ del user
  - INSERT instancias faltantes con `recurrence_parent_id = parent.id`
  - Idempotente: skip instancias que ya existen para esa fecha
- [ ] Edit recurring activity: cambio simple en parent regenera futuras (semana siguiente en adelante), instancias pasadas intactas
- [ ] Delete recurring activity: prompt "¿borrar solo esta instancia o también próximas?"
- [ ] BR-11 actualizada en código: validator rechaza RRULE strings legacy (`FREQ=*`) con mensaje de migración

## Acceptance Criteria

```gherkin
Scenario: Weekly preset
  Given user crea activity "Gym" con preset semanal L-W-V
  Then recurrence_rule stored: "weekly:MO,WE,FR"
  And cron materializa ~6 instancias en próximos 14 días

Scenario: Daily preset
  Given user crea activity "Diario" con preset diaria
  Then recurrence_rule stored: "daily"
  And cron materializa 14 instancias

Scenario: Monthly day-of-month
  Given user crea activity "Renta" con preset día 1 del mes
  Then recurrence_rule stored: "monthly:1"
  And cron materializa la próxima ocurrencia del día 1 dentro de la ventana

Scenario: Monthly last
  Given user crea activity con preset "último día del mes"
  Then recurrence_rule stored: "monthly:last"
  And cron resuelve correctamente meses con 28/29/30/31 días

Scenario: Invalid rule rejected
  Given server action recibe recurrence_rule = "FREQ=WEEKLY;BYDAY=MO"
  Then 400 invalid_recurrence_rule con hint "use DSL simplificado"

Scenario: Idempotent materialization
  Given recurrence ya materializada
  When cron corre de nuevo
  Then no instancias duplicadas creadas

Scenario: DST transition
  Given recurring weekly activity cruza cambio DST
  Then instancias creadas correctamente en TZ local del user
```

## Definition of Done

- [ ] Parser + validator con tests unitarios (≥ 12 casos, válidos + inválidos)
- [ ] Component test (RTL) del `RecurrencePicker`: cambiar entre presets actualiza el valor del form correctamente
- [ ] Inngest cron tested
- [ ] Edge case DST cubierto
- [ ] Performance: materialización < 5s para user con 50 recurring activities
- [ ] BR-11 reference doc apunta al DSL nuevo (no a RRULE)
