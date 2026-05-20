---
id: EPIC-GOALS
title: Goals (entidad separada) + M2M linkage + review
milestone: v1.0
priority: P1
status: ready
story_points: 12
issues: [ISSUE-040, ISSUE-041, ISSUE-042, ISSUE-043]
features: [FT-040, FT-041, FT-042, FT-043]
user_stories: [US-040, US-041, US-042, US-043]
business_rules: [BR-6, BR-9]
screens: [SCR-022, SCR-043, SCR-053]
---

# EPIC-GOALS — Goals entidad separada

## Goal

User puede crear goals (scope: quarter/year), vincularlos M2M con Projects/Activities, y hacer review con calificación 1-10 cuando deadline pasa. Goals viven FUERA de jerarquía operacional (BR-6).

## Why this matters

Goals son el componente largo-plazo del producto. Sin ellos, planeación queda en day/week sin conexión a propósito. Decisión Q8 del Discovery: goals como entidad separada con review 1-10 (no OKR ni text-only).

## Out of scope

- 5-Year y Life sheets (v2)
- Pattern detection of goal stagnation (v1.5 — F-21)

## Dependencies

- EPIC-ORG (linkage a Projects + Activities)
- EPIC-AUTH (Goals pertenecen a User)

## Issues

| ID        | Title                                                                         | SP  | Priority |
| --------- | ----------------------------------------------------------------------------- | --- | -------- |
| ISSUE-040 | Goal schema + CRUD + scope enum (quarter/year/5year/life)                     | 3   | P1       |
| ISSUE-041 | GoalLink M2M polymorphic + linking UI en Activity/Project detail              | 3   | P1       |
| ISSUE-042 | Goal review flow (modal SCR-053): score 1-10 + BR-9 status derivation         | 3   | P1       |
| ISSUE-043 | Goals screen (SCR-022): tabs por scope + progress calc + review-pending badge | 3   | P1       |
