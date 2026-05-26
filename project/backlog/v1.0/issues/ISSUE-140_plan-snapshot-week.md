---
id: ISSUE-140
title: PlanSnapshot (scope=week) — schema E-027 + freeze action + viewer + moved-from indicator
epic: EPIC-SHEETS
milestone: v1.0
priority: P1
story_points: 8
status: ready
dependencies: [ISSUE-013, ISSUE-032, ISSUE-033]
user_stories: [US-140, US-141, US-142]
features: [FT-140, FT-141, FT-142]
screens: [SCR-021b]
business_rules: [BR-18]
agents: [backend-specialist, frontend-specialist]
skills: [/database, /backend, /frontend]
entities: [E-027]
components: [CMP-143, CMP-144]
---

# ISSUE-140 — PlanSnapshot week scope

## Overview

Entidad `PlanSnapshot` (E-027) con `scope='week'`. User puede "congelar" el plan semanal al inicio de la semana → snapshot inmutable del estado de las activities (date, status, project, quadrant). Banner persistente arriba del view. "Moved-from" indicator en cada task que cambió de fecha post-snapshot. Vista `PlanSnapshotViewer` para comparar plan original vs ejecución real.

## Tasks

- [ ] Migration `plan_snapshots` per E-027:
  - `id uuid pk`
  - `user_id uuid NOT NULL FK → users.id ON DELETE CASCADE`
  - `scope text NOT NULL CHECK (scope IN ('week','month'))`
  - `reference_id uuid NOT NULL` — FK lógica a week_sheets.id (este issue cubre week; month en ISSUE-141)
  - `frozen_at timestamptz NOT NULL DEFAULT now()`
  - `payload jsonb NOT NULL`
  - `created_at timestamptz NOT NULL DEFAULT now()`
  - UNIQUE `(user_id, scope, reference_id)` — BR-18
  - DB trigger que rechaza UPDATE de `payload` si row ya tiene `frozen_at` set (BR-18 append-only)
- [ ] Server actions:
  - `freezeWeekPlan(weekSheetId)` → INSERT row con scope='week', reference_id=weekSheetId, payload=snapshot. Rechaza si ya existe (BR-18 no upsert)
  - `unfreezeWeekPlan(weekSheetId)` → DELETE row (casos de error/borrado). Confirm UI obligatorio
  - `getWeekSnapshot(weekSheetId)` → SELECT row (read-only)
- [ ] Payload format:
  ```json
  {
    "activities": [
      {
        "activityId": "uuid",
        "title": "...",
        "scheduledDates": ["2026-05-19"],
        "priority": 3,
        "quadrant": 2,
        "projectId": "uuid",
        "status": "pending"
      },
      ...
    ],
    "frozenAtIso": "2026-05-18T20:00:00Z"
  }
  ```
- [ ] CMP-143 `PlanSnapshotControls`:
  - Botón "Congelar plan" cuando no hay snapshot del week actual
  - Banner "Plan congelado · [fecha]" cuando hay snapshot
  - Acciones desde banner: "Ver plan original" → abre PlanSnapshotViewer / "Descongelar" → confirm modal → delete snapshot
- [ ] CMP-144 `PlanSnapshotViewer`:
  - Modal o pantalla dedicada que muestra payload original
  - Tabla / lista: title, fecha original, fecha actual, status actual, indicador de cambio
- [ ] "Moved-from" indicator en activity row de Week view:
  - Si snapshot existe y `activity.scheduled_dates ≠ snapshot.scheduledDates` → icon History junto al row
  - Tooltip/press: "Movida desde [fecha original del snapshot]"
  - Aplica también al cambio pool → día y viceversa
  - Indicador desaparece si user descongela o activity vuelve al estado original
- [ ] Re-congelar (caso edge): pop-up "Ya existe snapshot de esta semana. Descongelar primero y volver a congelar?" (no upsert per BR-18)

## Acceptance Criteria

```gherkin
Scenario: Congelar plan
  Given week sin snapshot
  When user tap "Congelar plan"
  Then action freezeWeekPlan llamada
  Row creado con payload del estado actual
  Banner aparece: "Plan congelado · 2026-05-18 14:00"

Scenario: BR-18 inmutabilidad (no upsert)
  Given snapshot ya existe para week W
  When user tap "Congelar plan" otra vez
  Then UI muestra confirm "Descongelar primero?" — no upsert silent
  Si user confirma → unfreezeWeekPlan + freezeWeekPlan secuenciales (2 actions)

Scenario: BR-18 trigger DB
  Given snapshot con frozen_at set
  When INSERT/UPDATE directo a payload
  Then trigger rechaza con ERROR

Scenario: Moved-from indicator
  Given snapshot con activity A en 2026-05-19
  When user mueve A a 2026-05-22
  Then row de A en /week muestra History icon
  Tooltip: "Movida desde 2026-05-19"

Scenario: Indicador desaparece al volver
  Given moved-from activo
  When user mueve A de vuelta a 2026-05-19
  Then indicator desaparece

Scenario: Descongelar
  Given snapshot activo
  When user tap "Descongelar" en banner
  Then confirm modal
  Tras confirm → action unfreezeWeekPlan, row borrado
  Banner desaparece, todos los moved-from indicators desaparecen

Scenario: PlanSnapshotViewer
  Given snapshot activo
  When user tap "Ver plan original"
  Then modal muestra lista de activities con fecha original vs fecha actual
  Cambios destacados visualmente

Scenario: Component test (RTL)
  Given mock sin snapshot
  When user tap "Congelar plan"
  Then action freezeWeekPlan llamada
  Banner re-renderiza
  When tap "Descongelar" + confirm
  Then action unfreezeWeekPlan llamada, banner removido
```

## Definition of Done

- [ ] Migration aplicada con UNIQUE + trigger BR-18
- [ ] Server actions `freeze/unfreeze/get` con tests (≥ 4 casos)
- [ ] CMP-143 + CMP-144 implementados
- [ ] Moved-from indicator funcional en `/week`
- [ ] Component test (RTL) cubre freeze → moved-from → unfreeze (≥ 2 tests)
- [ ] BR-18 enforced a nivel DB (trigger + UNIQUE)
- [ ] Performance: payload JSON serializado < 50KB para week con 100 activities
