---
id: ISSUE-014
title: Activity UI — quick-add inline + detail view
epic: EPIC-ORG
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-013]
user_stories: [US-015, US-016]
features: [FT-012]
screens: [SCR-040, SCR-051]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-050, CMP-052, CMP-053]
---

# ISSUE-014 — Activity UI

## Overview

Build ActivityQuickAdd component (inline en Today) y ActivityDetail screen (SCR-040). Voice capture flow se conecta acá en EPIC-VOICE.

## Tasks

- [ ] CMP-052 ActivityQuickAdd: inline form (en Today header area)
  - Title input (autofocus)
  - Compact row: project dropdown + date quick-pick + priority dots
  - "+ más detalles" disclosure expandiendo description, deadline, time, estimated_minutes, recurrence, tags, goal link (goal link wired en EPIC-GOALS)
  - Submit con Enter → create + clear + refocus title
- [ ] CMP-053 ActivityDetail (SCR-040):
  - Header: big checkbox + title (serif h2 inline editable)
  - Sections: PROYECTO / DESCRIPCIÓN / PROGRAMADA (date + time) / PRIORIDAD / DEADLINE / TIEMPO ESTIMADO / TAGS / SUBTASKS (placeholder, ISSUE-015) / GOALS (placeholder, EPIC-GOALS)
  - Footer: "Marcar como hecha" primary CTA + "Borrar" destructive
  - "Eventos Google" info badge si hay overlap (lazy load, real in EPIC-CALENDAR)
- [ ] CMP-050 ActivityCard (compact, para lists):
  - Checkbox + title + project label (caption) + deadline badge + priority dots
  - Swipe-able mobile (status options)
- [ ] Inline edit pattern: tap field → editable input → blur or Cmd+Enter to save + optimistic UI + Toast "Guardado." con undo 4s

## Acceptance Criteria

```gherkin
Scenario: Quick add con Enter
  Given user en Today
  When she types "Llamar a Juan" en quick-add + Enter
  Then activity created con default values
  And form clears + focus returns to title input

Scenario: Activity detail view + inline edit
  Given activity con title "Llamar a Juan"
  When user navigates to /activities/[id] and taps title
  Then becomes editable
  When she edits to "Llamar a Juan Pérez" + Cmd+Enter
  Then saved + Toast "Guardado." with undo
  When she taps undo within 4s
  Then change reverts

Scenario: Mobile swipe
  Given activity card en list
  When user swipes left
  Then status options appear (done / skipped / blocked)
```

## Definition of Done

- [ ] Quick-add works mobile + desktop
- [ ] Detail view responsive
- [ ] Inline edit pattern reusable (DD-009)
- [ ] Tests para optimistic update + undo
