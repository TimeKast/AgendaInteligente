---
id: ISSUE-042
title: Goal review flow (modal SCR-053) — score 1-10 + BR-9 status derivation
epic: EPIC-GOALS
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-040]
user_stories: [US-042]
features: [FT-042]
screens: [SCR-053]
business_rules: [BR-9]
agents: [backend-specialist, frontend-specialist]
skills: [/backend, /frontend]
---

# ISSUE-042 — Goal review flow

## Overview

Cuando deadline pasa, mostrar badge "Review pendiente" en goal. Tap → modal SCR-053 con slider 1-10 + notes + status auto-derived per BR-9 + user override option.

## Tasks

- [ ] Server Action `reviewGoal(goalId, { reviewScore, reviewNotes, statusOverride? })`
  - Validates score 1-10
  - Derives status from score per BR-9 (8-10 → achieved, 4-7 → partial, 1-3 → abandoned)
  - If `statusOverride` provided, uses that instead
  - Sets `reviewed_at = now`
- [ ] SCR-053 Goal review modal:
  - Header con goal title
  - Slider 1-10 con marks (1, 5, 10)
  - Textarea notes (opcional) con italic serif placeholder "Qué cumpliste, qué no, por qué"
  - Status sugerido shown como radio cards (auto-selected based on slider)
  - User can override radio
  - "Guardar review" button
- [ ] Badge "Review pendiente" en Goal card cuando `deadline < today AND reviewed_at IS NULL AND status='active'`
- [ ] Después de review, status updates en Goal list

## Acceptance Criteria

```gherkin
Scenario: Score 9 → achieved
  Given goal con deadline=ayer + status=active + reviewed_at=null
  Then card muestra "Review pendiente" badge
  When user opens review modal + slider=9
  Then status sugerido = "Achieved"
  When user saves
  Then goal.status=achieved, review_score=9, reviewed_at=now

Scenario: Override status
  Given slider=8 (sugiere "Achieved")
  When user selects "Partial" override
  Then goal.status=partial, review_score=8 (NO modifica)

Scenario: Score 3 → abandoned
  Given slider=3
  Then suggested = "Abandoned"

Scenario: Cancel review
  Given modal open, user types notes
  When she taps Cancelar
  Then no changes saved, status stays 'active'
```

## Definition of Done

- [ ] BR-9 logic tested unit (U-005)
- [ ] Modal responsive
- [ ] Badge logic tested
- [ ] After review, no longer shows "Review pendiente"
