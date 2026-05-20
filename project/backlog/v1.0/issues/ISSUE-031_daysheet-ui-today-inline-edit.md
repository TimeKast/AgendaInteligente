---
id: ISSUE-031
title: DaySheet UI (Today screen sheet section) + inline edit campos
epic: EPIC-SHEETS
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-025, ISSUE-030]
user_stories: [US-030, US-031, US-032]
features: [FT-030, FT-031, FT-032, FT-033]
screens: [SCR-020]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-060, CMP-062]
---

# ISSUE-031 — DaySheet UI

## Overview

Build DaySheet view (CMP-060) as part of Today screen. Inline editable fields per DD-009. Scope accent bar lateral, serif headlines, italic placeholders.

## Tasks

- [ ] CMP-060 DaySheetView:
  - Scope accent bar lateral (4px width, color `--scope-day`)
  - Section title serif h2 "Intención de hoy"
  - SheetField components per field (CMP-062)
  - Sections divididas por `--rule` hairlines
  - Morning section (intention, gratitude, identity, 3 wins, avoidance, energy 3 sliders)
  - Evening section (evening_win, evening_lesson, tomorrow_top, insight)
  - Completion badges (✓ morning / ⊘ evening) en header
- [ ] CMP-062 SheetField:
  - Display value (text large body serif para reflective fields)
  - Tap → becomes editable textarea
  - Italic serif placeholders evocativos per DD-023:
    - intention: _"Una intención, en una frase"_
    - gratitude: _"Algo por lo que estás agradecido"_
    - identity: _"Hoy soy alguien que…"_
    - avoidance: _"Lo que estás evitando hoy"_
    - evening*win: *"Una victoria de hoy"\_
    - evening*lesson: *"Una lección"\_
    - tomorrow*top: *"Mañana, en una frase"\_
    - insight: _"Algo que valga la pena guardar"_
  - Blur or Cmd+Enter → save via Server Action `updateDaySheetField(date, field, value)`
  - Optimistic UI + Toast "Guardado." con undo
- [ ] Energy: 3 sliders (CMP-017) 1-5 con labels "Físico / Mental / Emocional"
- [ ] Wins planned: 3 mini-inputs (max 3 per BR-7 check)
- [ ] Past-date access: read-only by default, "Editar" toggle (DD-009)

## Acceptance Criteria

```gherkin
Scenario: Inline edit intention
  Given DaySheet empty
  When user taps "Una intención, en una frase" placeholder
  Then becomes textarea
  When she types "terminar el reporte trimestral antes de las 13" + blurs
  Then field saved, Toast "Guardado." with undo 4s

Scenario: Energy slider
  Given DaySheet open
  When user moves Físico slider to 4
  Then energy_physical = 4 saved
  And UI persists

Scenario: Max 3 wins enforced
  Given wins_planned has 3 items
  When user tries to add 4th
  Then UI prevents y muestra "Máximo 3 wins"

Scenario: Past day read-only
  Given user views past day (e.g., last week)
  Then sheet shown but fields not editable by default
  When user taps "Editar" toggle
  Then fields become editable (US-032)
```

## Definition of Done

- [ ] CMP-060 + CMP-062 reusables (también para WeekSheet later)
- [ ] Italic serif placeholders contrast tested (axe-core)
- [ ] Mobile + desktop layout
- [ ] Optimistic save undo works
