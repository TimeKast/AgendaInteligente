---
id: EPIC-SHEETS
title: DaySheet + WeekSheet + MonthSheet + PlanSnapshot (MVP)
milestone: v1.0
priority: P1
status: ready
story_points: 45
issues:
  [
    ISSUE-030,
    ISSUE-031,
    ISSUE-032,
    ISSUE-033,
    ISSUE-034,
    ISSUE-035,
    ISSUE-131,
    ISSUE-137,
    ISSUE-139,
    ISSUE-140,
    ISSUE-141,
  ]
features:
  [FT-030, FT-031, FT-032, FT-033, FT-034, FT-035, FT-036, FT-131, FT-137, FT-140, FT-141, FT-142]
user_stories:
  [US-030b, US-031b, US-032, US-033, US-034, US-035, US-131, US-137, US-140, US-141, US-142]
business_rules: [BR-7, BR-17, BR-18, BR-19, OPS-7]
screens: [SCR-020, SCR-021, SCR-026, SCR-060]
---

# EPIC-SHEETS — DaySheet + WeekSheet + MonthSheet + PlanSnapshot

## Goal

User tiene sheets estructurados Day (set consolidado prototipo), Week (kickoff Sunday + review Saturday), **Month** (planning + close), y mecanismo de **PlanSnapshot** (week + month) para congelar plan vs comparar con ejecución real. Vista lectura + edición manual inline + auto-create por cron. Cierre del día simplificado con outcome per-activity + close_summary.

## Why this matters

Sheets son el SSOT del **loop reflexivo** del producto. Sin sheets, AgendaInteligente es una to-do list más. Reflejan la North Star "no te dejes mentirte sobre tu tiempo".

Con la iteración prototipo, MonthSheet y PlanSnapshot se promueven a in-scope v1.0 — el ciclo planning→ejecución→cierre necesita los 3 períodos (day/week/month) y un mecanismo de comparabilidad para que el agente pueda detectar patrones reales.

## Out of scope

- Quarter/Year sheets (v1.5)
- Pattern detection automatizado (v1.5)
- Llenado conversacional vía agente (cubierto en EPIC-AI-AGENT — la versión simplificada del cierre vive en este epic vía ISSUE-139)

## Dependencies

- EPIC-ORG (sheets referencian Activities; outcome per-activity persiste en Activity)
- EPIC-AUTH (sheets pertenecen a User)

## Issues

| ID        | Title                                                                                | SP  | Priority |
| --------- | ------------------------------------------------------------------------------------ | --- | -------- |
| ISSUE-030 | DaySheet schema consolidado (sin energy/intention/gratitude) + getOrCreate + UNIQUE  | 3   | P0       |
| ISSUE-031 | DaySheet UI (Today screen sheet section) + inline edit campos                        | 5   | P1       |
| ISSUE-032 | WeekSheet schema + week_starting helper (Sunday-in-user-TZ)                          | 3   | P0       |
| ISSUE-033 | Week screen (SCR-021): WeekSheet + 7-day carousel/grid                               | 5   | P1       |
| ISSUE-034 | Friday cron: materialize next WeekSheet (OPS-7)                                      | 2   | P1       |
| ISSUE-035 | Manual edit any field any past date + optimistic save                                | 3   | P2       |
| ISSUE-131 | MonthSheet schema (E-026) + pantalla `/month` con grid + month picker                | 8   | P1       |
| ISSUE-137 | Activity.progress_percent — slider en close-day modal + BR-17 enforcement            | 2   | P1       |
| ISSUE-139 | CloseDayModal — outcome per-activity + close_summary (reemplaza flow conversacional) | 5   | P0       |
| ISSUE-140 | PlanSnapshot (scope=week) — schema E-027 + freeze + viewer + moved-from indicator    | 8   | P1       |
| ISSUE-141 | PlanSnapshot (scope=month) — extender freeze/viewer al MonthSheet                    | 3   | P2       |
