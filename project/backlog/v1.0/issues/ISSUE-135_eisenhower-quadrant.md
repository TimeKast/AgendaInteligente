---
id: ISSUE-135
title: Activity.quadrant (Eisenhower) + UI matriz 2×2 en `/today` con drag entre cuadrantes
epic: EPIC-TIME
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-013, ISSUE-014]
user_stories: [US-135]
features: [FT-135]
screens: [SCR-021b]
business_rules: [BR-17]
agents: [frontend-specialist, backend-specialist]
skills: [/frontend, /backend]
components: [CMP-138]
---

# ISSUE-135 — Eisenhower quadrant

## Overview

Activity.quadrant materializado (1-4) que el user clasifica manualmente vía drag-and-drop en la vista "Matriz" de `/today`. Persiste por activity. NO se deriva automáticamente de priority/urgency — la decisión es explícita del user (puede mover sin cambiar priority).

> El campo `quadrant smallint NULL CHECK (quadrant BETWEEN 1 AND 4)` ya se agrega en ISSUE-013 (schema). Este issue cubre **la UI + server action de update + view "Matriz"**.

## Cuadrantes

| Quadrant | Etiqueta                   | Significado             |
| -------- | -------------------------- | ----------------------- |
| 1        | Urgente + Importante       | "Hazlo ya"              |
| 2        | No urgente + Importante    | "Planifícalo"           |
| 3        | Urgente + No importante    | "Delégalo / minimízalo" |
| 4        | No urgente + No importante | "Elimínalo"             |

## Tasks

- [ ] Server action `updateActivityQuadrant({ activityId, quadrant: 1|2|3|4|null })`:
  - Wrap con `withSelf` (self-service, user updatea sus propias activities)
  - Zod schema con `quadrant.nullable()`
  - revalidatePath('/today')
- [ ] Toggle de vista en `/today`: "Lista" / "Grid horario" / "Matriz" (3 tabs o segmented control)
- [ ] CMP-138 `EisenhowerMatrix`:
  - Layout grid 2×2 con 4 sub-zonas etiquetadas
  - Activities scheduled hoy se distribuyen según `quadrant`
  - Activities sin `quadrant` aparecen en una zona "Sin clasificar" arriba de la matriz (no dentro)
  - Cada activity como pill draggable (DnD library: `@dnd-kit/core` ya instalado o instalar — verificar primero)
- [ ] Drag entre zonas → action `updateActivityQuadrant(id, newQuadrant)` optimistic
- [ ] Drag a "Sin clasificar" → `quadrant = null`
- [ ] Detail view de activity (`/activities/[id]`): select dropdown para `quadrant` con opciones "Sin clasificar / Q1 / Q2 / Q3 / Q4 + descripción corta"
- [ ] CHECK constraint ya cubierto en ISSUE-013 schema

## Acceptance Criteria

```gherkin
Scenario: Default sin clasificar
  Given activity nueva sin quadrant
  When user abre /today vista Matriz
  Then activity aparece en zona "Sin clasificar" arriba

Scenario: Drag a Q1
  Given activity en "Sin clasificar"
  When user drag a Q1 (urgente + importante)
  Then action updateActivityQuadrant llamada con quadrant=1
  Activity persiste y aparece en Q1 en próximas cargas

Scenario: Drag entre cuadrantes
  Given activity en Q3
  When user drag a Q1
  Then quadrant=1 persistido
  Priority del activity NO cambia (independientes)

Scenario: Validation server side
  Given action recibe quadrant=5
  Then 400 validation_failed (Zod refine + CHECK)

Scenario: Edit desde detail view
  Given activity en /activities/<id>
  When user cambia select quadrant a "Q2 — Planifícalo"
  Then update persiste

Scenario: Component test (RTL)
  Given mock con 3 activities (1 sin clasificar, 1 en Q1, 1 en Q3)
  When user drag de Q3 a Q1
  Then action updateActivityQuadrant llamada con (id, 1)
  Activity desaparece de Q3 y aparece en Q1 en DOM

Scenario: Vista "Matriz" no rompe otras vistas
  Given user con quadrant clasificados
  When abre vista "Lista"
  Then activities aparecen normalmente (quadrant no afecta orden default)
```

## Definition of Done

- [ ] Server action con tests unitarios (Zod, casos válidos + inválidos)
- [ ] CMP-138 con drag-and-drop funcional
- [ ] Component test (RTL) cubre drag entre cuadrantes + drag a sin clasificar (≥ 2 tests)
- [ ] Mobile 375px: matriz usable con touch (no requiere hover)
- [ ] Detail view dropdown funcional
- [ ] BR-17 reference (independencia quadrant vs priority) documentada en comentario
