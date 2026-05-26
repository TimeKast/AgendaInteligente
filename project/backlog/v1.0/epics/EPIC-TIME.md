---
id: EPIC-TIME
title: Modelo temporal (scheduled_dates / duration / quadrant / recurrence / resize / status)
milestone: v1.0
priority: P0
status: ready
story_points: 34
issues:
  [
    ISSUE-020,
    ISSUE-021,
    ISSUE-022,
    ISSUE-023,
    ISSUE-024,
    ISSUE-025,
    ISSUE-135,
    ISSUE-136,
    ISSUE-138,
  ]
features:
  [FT-020, FT-021, FT-022, FT-023, FT-024, FT-025, FT-026, FT-027, FT-028, FT-135, FT-136, FT-138]
user_stories:
  [US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027, US-135, US-136, US-138]
business_rules: [BR-7, BR-8, BR-11, BR-15, BR-16, OPS-5]
screens: [SCR-020, SCR-021b, SCR-040, SCR-052, SCR-061]
---

# EPIC-TIME — Modelo temporal

## Goal

User puede asignar tareas a días específicos (single date o multi-date array) con hora opcional + duration, deadline separado, **quadrant Eisenhower** clasificable, prioridad 1-5, recurrencias (DSL simplificado), **resize de bloques en grid horario**, y vista Today agrupada.

## Why this matters

Sin scheduling, Activities son lista plana. Modelo prototipo (anchored con `scheduled_time + duration_minutes`, multi-día con `scheduled_dates[]`, pool con `scheduled_dates=[]`) es decisión clave del producto. Recurrencia materializada (BR-11 con DSL simplificado) evita queries infinitos. Quadrant materializado (BR-17) separa prioridad de matriz de Eisenhower (decisión user-driven, no derivada).

## Out of scope

- Calendar integration (cubierto en EPIC-CALENDAR)
- Sheet linkage (EPIC-SHEETS)
- `time_blocks` semánticos (DEPRECATED por prototipo — ver ISSUE-021)

## Dependencies

- EPIC-ORG (necesita Activity entity con campos prototipo — ISSUE-013)

## Issues

| ID        | Title                                                                                      | SP  | Priority |
| --------- | ------------------------------------------------------------------------------------------ | --- | -------- |
| ISSUE-020 | scheduled_dates (array) + scheduled_time inputs + DatePicker quick-picks + duration anchor | 3   | P0       |
| ISSUE-021 | time_blocks multi-select — **DEPRECATED** (prototipo invalidó el modelo)                   | 0   | —        |
| ISSUE-022 | Deadline separate field + DeadlineBadge (warning/danger)                                   | 2   | P1       |
| ISSUE-023 | Priority 1-5 input + sorting en lists                                                      | 2   | P0       |
| ISSUE-024 | Recurrence DSL simplificado (daily/weekly/monthly) + cron materialización 14 días          | 5   | P2       |
| ISSUE-025 | Today screen (SCR-020) layout + ActivityList groupBy + Grid horario + Matriz toggle        | 5   | P0       |
| ISSUE-135 | Activity.quadrant (Eisenhower) + UI matriz 2×2 en `/today` con drag entre cuadrantes       | 5   | P1       |
| ISSUE-136 | scheduled_dates[] — migration array + normalization helper + multi-date picker UI          | 5   | P1       |
| ISSUE-138 | Resize handles en bloque del grid horario (top + bottom) con validación de solape          | 5   | P2       |
