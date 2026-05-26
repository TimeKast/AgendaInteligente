---
id: ISSUE-138
title: Resize handles en bloque del grid horario (top + bottom) con validación de solape
epic: EPIC-TIME
milestone: v1.0
priority: P2
story_points: 5
status: ready
dependencies: [ISSUE-013, ISSUE-020, ISSUE-025, ISSUE-091]
user_stories: [US-138]
features: [FT-138]
screens: [SCR-021b]
business_rules: [BR-16]
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-141]
---

# ISSUE-138 — Resize handles en bloque calendar grid

## Overview

En la vista "Grid" de `/today` (calendario por horas), cada bloque anchored tiene handles top + bottom (5-6px) para ajustar `scheduled_time` (drag top) o `duration_minutes` (drag bottom). Validación: no solapar con otras tasks scheduled del user ni con eventos externos de calendar connections (busy slots).

## Tasks

- [ ] CMP-141 `ResizableTimeBlock` wrapper:
  - Top handle: 5-6px de altura en el borde superior, cursor `ns-resize`
  - Bottom handle: igual en el borde inferior
  - Visibles SIEMPRE en desktop hover, en mobile aparecen con tap-hold (long press 500ms)
  - Snap a intervalos de 15 min (visual + numeric)
  - Mínimo `duration_minutes = 15`
- [ ] Drag top handle:
  - Ajusta `scheduled_time` (start_time)
  - `end_time` fijo (= scheduled_time + duration_minutes original)
  - Resultado: nuevo `scheduled_time` + `duration_minutes` recalculado (end_fixed - new_start)
- [ ] Drag bottom handle:
  - Ajusta `duration_minutes`
  - `scheduled_time` (start) fijo
  - Resultado: nuevo `duration_minutes`
- [ ] Validación pre-commit (en client antes de llamar action):
  - Query in-memory de tasks scheduled del día + busy slots (de calendar connections enabled)
  - Si el nuevo rango se solapa con cualquiera → cancelar resize visualmente + mostrar toast "No se puede solapar con [otra task / evento de Google]"
  - Si no se solapa → optimistic update + action `updateActivity({ scheduled_time, duration_minutes })`
- [ ] Validation server-side (defensive — race condition):
  - Server action verifica solape antes de persistir
  - Si server detecta solape (entre el moment del optimistic UI y el server) → return error, UI revierte
- [ ] BR-16: `duration_minutes` requiere `scheduled_time` — ya enforced en ISSUE-013 schema

## Acceptance Criteria

```gherkin
Scenario: Drag bottom handle (extend duration)
  Given block con scheduled_time=10:00 y duration_minutes=30
  When user drag bottom handle hacia abajo a la marca de 11:00
  Then snap a 15 min, nuevo duration_minutes=60
  Action updateActivity llamada con duration_minutes=60

Scenario: Drag top handle (adjust start)
  Given block con scheduled_time=10:00, duration_minutes=60 (end=11:00)
  When user drag top handle hacia arriba a 9:30
  Then nuevo scheduled_time=9:30, duration_minutes=90 (end fijo en 11:00)

Scenario: Solape con otra task del user
  Given block A scheduled 10:00-11:00 y block B scheduled 11:30-12:00
  When user extiende A drag bottom a 12:00 (solaparía con B)
  Then resize cancelado visualmente (snap back)
  Toast: "No se puede solapar con [B.title]"
  Action NO llamada

Scenario: Solape con busy slot externo
  Given user con CalendarConnection activa con event "Meeting" 11:00-12:00
  When user extiende block A scheduled 10:00-10:30 drag bottom a 11:30
  Then resize cancelado, toast "No se puede solapar con evento de Google (Meeting)"

Scenario: Mínimo 15 min
  Given block scheduled 10:00-10:30
  When user drag bottom handle hacia arriba a 10:10
  Then snap revierte a 10:15 (mínimo)
  duration_minutes=15

Scenario: Snap 15 min
  Given block scheduled 10:00-10:30
  When user drag bottom a marca 10:43
  Then snap a 10:45, duration_minutes=45

Scenario: Component test (RTL)
  Given mock con 2 activities (A 10-11, B 11:30-12) + 1 busy slot 13:00-14:00
  When simular drag bottom de A hasta 11:30 (solape con B)
  Then action updateActivity NO llamada
  Toast aparece en DOM
  When drag de A hasta 11:00 (sin solape)
  Then action llamada con duration_minutes=60
```

## Definition of Done

- [ ] CMP-141 funciona mouse (desktop) + touch (mobile con tap-hold)
- [ ] Snap a 15 min validado
- [ ] Mínimo 15 min enforced
- [ ] Validación cliente + servidor con solape (otras tasks + busy slots externos)
- [ ] Toast con contenido específico del conflicto (nombre de la otra entidad)
- [ ] Component test (RTL) cubre los 2 casos críticos (sin solape persiste, con solape cancela) — ≥ 2 tests
- [ ] Handles visibles pero discretos (no compiten visualmente con el contenido)
- [ ] BR-16 verificado (no permite resize a un block sin scheduled_time)
