---
id: ISSUE-136
title: scheduled_dates[] — migration array + normalization helper + multi-date picker UI
epic: EPIC-TIME
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-013, ISSUE-020]
user_stories: [US-136]
features: [FT-136]
screens: [SCR-061]
business_rules: [BR-15]
agents: [backend-specialist, frontend-specialist]
skills: [/database, /backend, /frontend]
components: [CMP-139]
---

# ISSUE-136 — `scheduled_dates` array + multi-day picker

## Overview

Reemplaza el campo legacy `scheduled_date date` (single) por `scheduled_dates date[]` (array normalizado — BR-15). Migration de datos existentes a array. Normalization helper en domain layer. UI multi-date picker (`MultiDayPicker` — CMP-139) que permite seleccionar N fechas específicas sin generar recurrencia RRULE/DSL.

> El campo `scheduled_dates date[] NOT NULL DEFAULT '{}'` ya se introduce en ISSUE-013. Este issue cubre **la migration de datos legacy + el helper de normalización + la UI multi-date picker**.

## Tasks

- [ ] Migration de datos:
  - Si hay producción con rows legacy con `scheduled_date date`: nueva columna `scheduled_dates date[] NOT NULL DEFAULT '{}'`, backfill con `scheduled_dates = CASE WHEN scheduled_date IS NULL THEN '{}' ELSE ARRAY[scheduled_date] END`
  - DROP `scheduled_date` después del backfill
  - Coordinar con ISSUE-013 migration (single migration o secuencial)
- [ ] Helper `normalizeScheduledDates(input: string[] | Date[])` en `src/lib/domain/activity-dates.ts`:
  - Acepta strings ISO o Date objects
  - Output: array de strings ISO únicos (Set), ordenados asc
  - Usado por Zod `transform` en `activitySchema`
  - Tests unitarios (≥ 5 casos: dup, mixed order, empty, single, mixed types)
- [ ] CMP-139 `MultiDayPicker`:
  - Calendar grid (mes con navegación ← / →)
  - Click en día → toggle selección (visual: día seleccionado destacado)
  - Lista de fechas seleccionadas como chips removibles arriba del calendario
  - Botón "Confirmar" en el bottom
  - Mobile-friendly (touch targets ≥ 44px)
- [ ] Integración en activity form:
  - Toggle "Programar en varios días específicos" cambia entre single DatePicker (ISSUE-020) y MultiDayPicker
  - Cuando user activa multi-día, recurrence picker se deshabilita con tooltip "No se puede combinar con recurrencia"
- [ ] Vistas que iteran:
  - `/today`, `/week`, `/month`: query usa `scheduled_dates @> ARRAY[?]::date[]` para filtrar por día
  - Cada aparición es instancia individual (marcar done en un día NO afecta los otros)
  - Para "instancia individual marcada done": al transicionar status='done', NO removemos del array (la activity completa transiciona). Decisión v1: si el user marca done en día 1 de 3, la activity completa pasa a done. Para granularidad por-día se usaría recurrence (con `recurrence_parent_id`) o split manual. **Documentar esta limitación en US-136 si confirmado por stakeholder** (ver "Lo que no supe resolver").

## Acceptance Criteria

```gherkin
Scenario: Migration de legacy scheduled_date
  Given DB con rows con scheduled_date = '2026-05-19' (legacy)
  When migration corre
  Then scheduled_dates = ['2026-05-19'] (array de 1 elemento)
  Y scheduled_date column drop'd

Scenario: BR-15 normalización
  Given input ['2026-05-21', '2026-05-19', '2026-05-21']
  When normalizeScheduledDates llamado
  Then output ['2026-05-19', '2026-05-21']

Scenario: Persistencia desde server action
  Given payload scheduled_dates = ['2026-05-19', '2026-05-19', '2026-05-21']
  When createActivity
  Then row persiste con ['2026-05-19', '2026-05-21'] (BR-15)

Scenario: Multi-day picker UI
  Given user en activity form
  When activa toggle "Varios días específicos"
  Y selecciona 3 días en el calendar
  Then chips muestran 3 fechas
  Botón Confirmar guarda con scheduled_dates = [3 fechas asc, deduped]

Scenario: Multi-día deshabilita recurrence
  Given user activa multi-día picker
  Then recurrence picker disabled + tooltip "No combinable con recurrencia"
  Cuando user limpia multi-día, recurrence picker se reactiva

Scenario: Query por día
  Given activity con scheduled_dates = ['2026-05-19', '2026-05-22']
  When query SELECT WHERE scheduled_dates @> ARRAY['2026-05-19'::date]
  Then row aparece
  GIN index usado (EXPLAIN ANALYZE)

Scenario: Component test (RTL)
  Given form con multi-day picker
  When user clickea 3 días
  Then chips muestran 3 fechas, action createActivity llamada con array correcto
```

## Definition of Done

- [ ] Migration ejecutada y reversible (backfill validado en tests)
- [ ] Helper `normalizeScheduledDates` con tests unitarios (≥ 5)
- [ ] CMP-139 MultiDayPicker funcional mobile + desktop
- [ ] Integración en form con toggle single/multi
- [ ] BR-15 enforced (Zod transform + DB index GIN)
- [ ] Component test (RTL) cubre multi-select + interacción con recurrence picker
- [ ] Documentar limitación "done en una fecha = done en todas" en doc o backlog v1.5 si stakeholder pide granularidad per-día
