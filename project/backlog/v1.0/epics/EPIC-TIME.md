---
id: EPIC-TIME
title: Modelo temporal (scheduled / deadline / recurrence / status)
milestone: v1.0
priority: P0
status: ready
story_points: 19
issues: [ISSUE-020, ISSUE-021, ISSUE-022, ISSUE-023, ISSUE-024, ISSUE-025]
features: [FT-020, FT-021, FT-022, FT-023, FT-024, FT-025, FT-026, FT-027, FT-028]
user_stories: [US-020, US-021, US-022, US-023, US-024, US-025, US-026, US-027]
business_rules: [BR-7, BR-8, BR-11, OPS-5]
screens: [SCR-020, SCR-040, SCR-052]
---

# EPIC-TIME — Modelo temporal

## Goal

User puede asignar tareas a días específicos con hora opcional, deadline separado, time blocks aspiracionales, prioridad 1-5, recurrencias (RRULE), y ver vista Today agrupada.

## Why this matters

Sin scheduling, Activities son lista plana. Modelo híbrido (anchored vs pool) es decisión clave del producto (X7 resolved). Recurrencia materializada (BR-11) evita queries infinitos.

## Out of scope

- Calendar integration (cubierto en EPIC-CALENDAR)
- Sheet linkage (EPIC-SHEETS)

## Dependencies

- EPIC-ORG (necesita Activity entity)

## Issues

| ID        | Title                                                               | SP  | Priority |
| --------- | ------------------------------------------------------------------- | --- | -------- |
| ISSUE-020 | scheduled_date + scheduled_time inputs + DatePicker quick-picks     | 3   | P0       |
| ISSUE-021 | time_blocks multi-select (morning/afternoon/evening)                | 2   | P1       |
| ISSUE-022 | Deadline separate field + DeadlineBadge (warning/danger)            | 2   | P1       |
| ISSUE-023 | Priority 1-5 input + sorting en lists                               | 2   | P0       |
| ISSUE-024 | Recurrence_rule RRULE input + cron materialization 14 días adelante | 5   | P2       |
| ISSUE-025 | Today screen (SCR-020) layout + ActivityList groupBy time_block     | 5   | P0       |
