---
id: ISSUE-035
title: Manual edit any sheet field any past date + optimistic save
epic: EPIC-SHEETS
milestone: v1.0
priority: P2
story_points: 3
status: ready
dependencies: [ISSUE-031, ISSUE-033]
user_stories: [US-032, US-035]
features: [FT-033]
screens: [SCR-020, SCR-021]
business_rules: []
agents: [frontend-specialist, backend-specialist]
skills: [/frontend, /backend]
---

# ISSUE-035 — Sheet manual edit past dates

## Overview

Past sheets are read-only by default. User can toggle "Editar" to edit retroactively (correct missing data, add late insights). Manual edits NO disparan AI challenges (only agent-driven edits do).

## Tasks

- [ ] UI: header de sheet view past muestra "Viendo [scope] pasado (read-only)" + "Editar" toggle
- [ ] When toggle ON: sheet fields become editable como en current
- [ ] When edits made: optimistic save + Toast "Guardado." con undo
- [ ] Backend: same Server Action `updateDaySheetField` / `updateWeekSheetField` — no special path
- [ ] No agent challenges fire on manual past-edit (challenges only en chat-driven updates)
- [ ] Edit history (basic): track `updated_at` per sheet (no field-level audit log v1)

## Acceptance Criteria

```gherkin
Scenario: View past sheet
  Given user views DaySheet del lunes pasado
  Then read-only mode default, "Editar" toggle visible

Scenario: Edit past
  Given user toggles "Editar" en past DaySheet
  When she updates evening_lesson
  Then field saved silently
  And agent does NOT fire challenge

Scenario: Save reverts on undo
  Given user just saved past edit
  Then Toast con undo 4s
  When user taps undo
  Then change reverted (field returns to prior value)
```

## Definition of Done

- [ ] Toggle UX works
- [ ] No challenges fire on past edit
- [ ] Existing tests not broken
