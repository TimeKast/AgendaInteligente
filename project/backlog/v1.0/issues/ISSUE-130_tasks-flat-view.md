---
id: ISSUE-130
title: Pantalla `/tasks` — vista plana cross-project con filtros, sort y búsqueda
epic: EPIC-ORG
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-013, ISSUE-014, ISSUE-134]
user_stories: [US-130]
features: [FT-130]
screens: [SCR-025]
business_rules: []
agents: [frontend-specialist, backend-specialist]
skills: [/frontend, /database]
components: [CMP-130, CMP-131]
---

# ISSUE-130 — Vista plana `/tasks`

## Overview

Nueva ruta `/tasks` accesible desde bottom nav. Lista todas las activities del user sin agrupar por proyecto. Filtros por status, sort por múltiples criterios, búsqueda fuzzy y capture rápido inline.

## Tasks

- [ ] Server action / query `listAllActivities({ userId, filter, sort, search })`:
  - `filter`: `open` (pending+in_progress) | `done` | `skipped` | `blocked` | `all` (default `open`)
  - `sort`: `date` (scheduled_dates[0] asc, nulls last) | `priority` (desc) | `deadline` (asc, nulls last) | `project` (alfabético)
  - `search`: ILIKE en `title` (fuzzy básico v1; trigram opcional v1.5)
  - Cursor pagination o limit 200 v1 (decisión: 200 fixed v1)
- [ ] Ruta `app/(agendaInteligente)/tasks/page.tsx`
- [ ] CMP-130 `TasksAllView` orchestrator:
  - Header con título + count
  - Filter chips horizontales (5 chips: open/done/skipped/blocked/all)
  - Sort dropdown (4 options)
  - Search input (debounced 300ms)
  - `ActivityQuickAdd` inline al tope con `default project=Inbox`
  - Lista vertical de `ActivityRow` (CMP existente reutilizado)
- [ ] CMP-131 `ActivityRow` adaptación si necesario:
  - title, project chip, scheduled_date (primer date de array), priority pip, status badge
  - tap → `/activities/[id]`
- [ ] URL state: `?filter=open&sort=date&q=texto` (sharable / back-button friendly)

## Acceptance Criteria

```gherkin
Scenario: Default view
  Given user con 50 activities mixed status
  When abre /tasks
  Then filter=open por default
  Lista muestra solo activities pending + in_progress
  Sort=date

Scenario: Filtrar done
  Given user en /tasks
  When tap chip "Done"
  Then URL = /tasks?filter=done
  Lista solo activities con status=done

Scenario: Sort por priority
  Given user en /tasks
  When cambia sort a "Priority"
  Then lista ordenada por priority DESC (5,4,3,2,1)

Scenario: Búsqueda
  Given activities incluyen "Reporte trimestral"
  When user escribe "trimes" en search
  Then lista filtra a las que contienen "trimes" (case-insensitive)

Scenario: Quick-add inline
  Given user en /tasks
  When escribe "Llamar plomero" + enter en ActivityQuickAdd
  Then activity creada con project=Inbox
  Lista refresca con el nuevo item al tope

Scenario: Tap row navega a detail
  Given lista con activities
  When user tap una row
  Then navega a /activities/[id]

Scenario: Component test (RTL)
  Given setup con 5 mock activities (3 open, 2 done)
  When user tap chip "Done"
  Then lista re-renderiza con solo 2 items
  When cambia sort a "Priority"
  Then orden DESC por priority verificado en DOM
```

## Definition of Done

- [ ] Ruta funcional + URL state sharable
- [ ] Filter + sort + search funcionan combinados (no exclusivos)
- [ ] Quick-add inline funcional
- [ ] Component test (RTL) cubre filter + sort + search (≥ 3 tests)
- [ ] Mobile 375px baseline sin horizontal scroll
- [ ] Empty state cuando no hay matches: "No hay tareas con estos filtros"
