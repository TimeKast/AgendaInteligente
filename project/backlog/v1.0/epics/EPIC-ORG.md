---
id: EPIC-ORG
title: Organización jerárquica (Cat / Proj / Act / Subtask / Tags)
milestone: v1.0
priority: P0
status: ready
story_points: 19
issues: [ISSUE-010, ISSUE-011, ISSUE-012, ISSUE-013, ISSUE-014, ISSUE-015, ISSUE-016, ISSUE-017]
features: [FT-010, FT-011, FT-012, FT-013, FT-014]
user_stories: [US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018]
business_rules: [BR-2, BR-3, BR-4, BR-5, BR-8]
screens: [SCR-040, SCR-041, SCR-042, SCR-051, SCR-052, SCR-054]
---

# EPIC-ORG — Organización jerárquica

## Goal

User puede crear Categorías → Proyectos → Actividades → Subtareas (1 nivel), con tags libres y status transitions correctas. Es la columna vertebral de la data del producto.

## Why this matters

Sin esta jerarquía no hay producto. Activities sin Project / Category huérfanas rompen Today/Week views. BR-2..5 son estructurales (DB enforced).

## Out of scope

- Time scheduling (cubierto en EPIC-TIME)
- Sheet integration (cubierto en EPIC-SHEETS)
- Goal linkage (cubierto en EPIC-GOALS)

## Dependencies

- EPIC-AUTH (necesita User table + scopedDb)

## Issues

| ID        | Title                                                                     | SP  | Priority |
| --------- | ------------------------------------------------------------------------- | --- | -------- |
| ISSUE-010 | Category schema + CRUD (Server Actions + API)                             | 3   | P0       |
| ISSUE-011 | Category drag-reorder + soft delete cascade con confirmación              | 2   | P1       |
| ISSUE-012 | Project schema + CRUD + status transitions                                | 3   | P0       |
| ISSUE-013 | Activity schema + base CRUD (sin scheduling avanzado, ese va a EPIC-TIME) | 3   | P0       |
| ISSUE-014 | Activity UI: quick-add + detail view                                      | 3   | P0       |
| ISSUE-015 | Subtask (1 nivel max) schema + inline UI                                  | 2   | P1       |
| ISSUE-016 | Tags chips input + autocomplete + normalize lowercase                     | 2   | P2       |
| ISSUE-017 | Activity status transitions (BR-8) + reason capture flow (FLW-009)        | 2   | P0       |
