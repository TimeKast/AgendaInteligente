---
id: ISSUE-132
title: Pantalla `/categories/[id]` — detalle de categoría con projects list y + Nuevo proyecto
epic: EPIC-ORG
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-010, ISSUE-012, ISSUE-134]
user_stories: [US-132]
features: [FT-132]
screens: [SCR-042b]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-134, CMP-135]
---

# ISSUE-132 — Detalle de categoría `/categories/[id]`

## Overview

Nueva ruta `/categories/[id]` accesible desde bottom nav "Categorías" (tap en row de la lista) o sidebar legacy. Muestra header de la categoría + lista de projects + acción "+ Nuevo proyecto" pre-rellenado con `category_id`.

## Tasks

- [ ] Ruta `app/(agendaInteligente)/categories/[id]/page.tsx` (params async per Next.js 16)
- [ ] Server query `getCategoryDetail(categoryId, userId)`:
  - Validar tenant ownership
  - Retornar categoría + projects con count activity (pending/done)
- [ ] CMP-134 `CategoryDetailHeader`:
  - Icon + nombre + color de la categoría
  - Edit pencil → opens edit modal (reutilizar CMP existente)
- [ ] CMP-135 `ProjectRow` (si no existe, crear o reutilizar):
  - Name + status badge + activity count (3 pending / 12 done) + deadline relativo
  - Tap → `/projects/[id]`
- [ ] Sort dropdown: status (active arriba) / deadline (asc, nulls last) / nombre (asc)
- [ ] Acción "+ Nuevo proyecto":
  - Abre `NewProjectModal` con `category_id` pre-rellenado (select deshabilitado mostrando la categoría actual)
  - On submit → createProject con ese category_id
- [ ] Empty state cuando la categoría no tiene projects: "Sin proyectos aún" + CTA "+ Nuevo proyecto"

## Acceptance Criteria

```gherkin
Scenario: Abrir detalle de categoría
  Given categoría "Trabajo" con 5 projects
  When user navega a /categories/<id>
  Then header muestra "Trabajo" con su icon y color
  Lista muestra 5 ProjectRow

Scenario: Nuevo proyecto pre-rellenado
  Given user en /categories/<id> de "Trabajo"
  When tap "+ Nuevo proyecto"
  Then modal abre
  Select de categoría muestra "Trabajo" y está deshabilitado (read-only)
  Al submit con name="Q3 OKRs", project creado con category_id = id-trabajo

Scenario: Sort
  Given 5 projects mixed status
  When user cambia sort a "Status"
  Then active arriba, archived abajo

Scenario: Tenant isolation
  Given categoría de user X
  When user Y intenta GET /categories/<id-de-X>
  Then 404 (scopedDb no devuelve row)

Scenario: Component test (RTL)
  Given mock con categoría "Trabajo"
  When user tap "+ Nuevo proyecto"
  Then modal renderiza
  Y el select de categoría tiene value="trabajo" + atributo disabled
```

## Definition of Done

- [ ] Ruta funcional con tenant guard
- [ ] Modal pre-rellenado con select disabled
- [ ] Sort funcional
- [ ] Component test (RTL) cubre modal pre-rellenado + tenant 404
- [ ] Empty state UI
- [ ] Mobile 375px sin overflow
