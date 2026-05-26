---
id: EPIC-ORG
title: Organización jerárquica (Cat / Proj / Act / Subtask / Tags) + vistas cross-project
milestone: v1.0
priority: P0
status: ready
story_points: 32
issues:
  [
    ISSUE-010,
    ISSUE-011,
    ISSUE-012,
    ISSUE-013,
    ISSUE-014,
    ISSUE-015,
    ISSUE-016,
    ISSUE-017,
    ISSUE-130,
    ISSUE-132,
    ISSUE-133,
  ]
features: [FT-010, FT-011, FT-012, FT-013, FT-014, FT-130, FT-132, FT-133]
user_stories:
  [US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018, US-130, US-132, US-133]
business_rules: [BR-2, BR-3, BR-4, BR-5, BR-8, BR-15, BR-16, BR-17]
screens: [SCR-025, SCR-040, SCR-041, SCR-042, SCR-042b, SCR-044, SCR-051, SCR-052, SCR-054]
---

# EPIC-ORG — Organización jerárquica + vistas cross-project

## Goal

User puede crear Categorías → Proyectos → Actividades → Subtareas (1 nivel), con tags libres y status transitions correctas. Es la columna vertebral de la data del producto. Iteración prototipo agrega 3 pantallas cross-project: `/tasks` (vista plana), `/categories/[id]` (detalle de categoría) y `/stats` (dashboard).

## Why this matters

Sin esta jerarquía no hay producto. Activities sin Project / Category huérfanas rompen Today/Week views. BR-2..5 son estructurales (DB enforced). Las nuevas vistas cross-project (US-130, US-132, US-133) son baseline UX validado en prototipo — el user navega tanto por proyecto como por vistas planas según contexto.

## Out of scope

- Time scheduling (cubierto en EPIC-TIME)
- Sheet integration (cubierto en EPIC-SHEETS)
- Goal linkage (cubierto en EPIC-GOALS)

## Dependencies

- EPIC-AUTH (necesita User table + scopedDb)
- ISSUE-134 (bottom nav unificada, para acceder a `/tasks`, `/categories`, `/stats`)

## Issues

| ID        | Title                                                                                                 | SP  | Priority |
| --------- | ----------------------------------------------------------------------------------------------------- | --- | -------- |
| ISSUE-010 | Category schema + CRUD (Server Actions + API)                                                         | 3   | P0       |
| ISSUE-011 | Category drag-reorder + soft delete cascade con confirmación                                          | 2   | P1       |
| ISSUE-012 | Project schema + CRUD + status transitions                                                            | 3   | P0       |
| ISSUE-013 | Activity schema + base CRUD (incluye quadrant, scheduled_dates[], progress_percent, duration_minutes) | 5   | P0       |
| ISSUE-014 | Activity UI: quick-add + detail view                                                                  | 3   | P0       |
| ISSUE-015 | Subtask (1 nivel max) schema + inline UI                                                              | 2   | P1       |
| ISSUE-016 | Tags chips input + autocomplete + normalize lowercase                                                 | 2   | P2       |
| ISSUE-017 | Activity status transitions (BR-8) + reason capture flow (FLW-009)                                    | 2   | P0       |
| ISSUE-130 | Pantalla `/tasks` — vista plana cross-project con filtros, sort y búsqueda                            | 5   | P1       |
| ISSUE-132 | Pantalla `/categories/[id]` — detalle de categoría con projects list y + Nuevo proyecto               | 3   | P1       |
| ISSUE-133 | Pantalla `/stats` — dashboard de KPIs (consistencia, completion, top projects, streak)                | 5   | P2       |
