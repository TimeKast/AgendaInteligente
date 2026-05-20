---
id: EPIC-SHEETS
title: DaySheet + WeekSheet (MVP)
milestone: v1.0
priority: P1
status: ready
story_points: 21
issues: [ISSUE-030, ISSUE-031, ISSUE-032, ISSUE-033, ISSUE-034, ISSUE-035]
features: [FT-030, FT-031, FT-032, FT-033, FT-034, FT-035, FT-036]
user_stories: [US-030, US-031, US-032, US-033, US-034, US-035]
business_rules: [BR-7, OPS-7]
screens: [SCR-020, SCR-021]
---

# EPIC-SHEETS — DaySheet + WeekSheet MVP

## Goal

User tiene sheets estructurados Day (morning + evening fields) y Week (kickoff Sunday + review Saturday). Vista lectura + edición manual inline + Auto-create por cron.

## Why this matters

Sheets son el SSOT del **loop reflexivo** del producto. Sin sheets, AgendaInteligente es una to-do list más. Reflejan la North Star "no te dejes mentirte sobre tu tiempo".

## Out of scope

- Llenado conversacional vía agente (cubierto en EPIC-AI-AGENT)
- Quarter/Year sheets (v1.5)
- Pattern detection (v1.5)

## Dependencies

- EPIC-ORG (sheets referencian Activities en wins_planned, calendar_blocks)
- EPIC-AUTH (sheets pertenecen a User)

## Issues

| ID        | Title                                                           | SP  | Priority |
| --------- | --------------------------------------------------------------- | --- | -------- |
| ISSUE-030 | DaySheet schema + getOrCreate helper (BR-7) + UNIQUE constraint | 3   | P0       |
| ISSUE-031 | DaySheet UI (Today screen sheet section) + inline edit campos   | 5   | P1       |
| ISSUE-032 | WeekSheet schema + week_starting helper (Sunday-in-user-TZ)     | 3   | P0       |
| ISSUE-033 | Week screen (SCR-021): WeekSheet + 7-day carousel/grid          | 5   | P1       |
| ISSUE-034 | Friday cron: materialize next WeekSheet (OPS-7)                 | 2   | P1       |
| ISSUE-035 | Manual edit any field any past date + optimistic save           | 3   | P2       |
