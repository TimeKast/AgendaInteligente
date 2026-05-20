---
id: ISSUE-043
title: Goals screen (SCR-022) — tabs by scope + progress calc + review-pending badge
epic: EPIC-GOALS
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-040, ISSUE-041, ISSUE-042]
user_stories: [US-043]
features: [FT-043]
screens: [SCR-022, SCR-043]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-056]
---

# ISSUE-043 — Goals screen

## Overview

Build SCR-022 Goals screen + SCR-043 Goal detail. Tabs por scope (Quarter / Year / 5-Year placeholder / Life placeholder). Progress bars compute based on linked activities/projects done.

## Tasks

- [ ] /goals route con tab UI:
  - Tabs: Quarter | Year | 5-Year (disabled v1) | Life (disabled v1)
  - URL state: `?scope=quarter` para shareable / browser-back
- [ ] CMP-056 GoalCard:
  - Header con scope chip + title
  - Deadline + countdown
  - Progress bar based on `% activities done linked`
  - "Review pendiente" badge si aplica (ISSUE-042 logic)
  - Tap → /goals/[id] (SCR-043)
- [ ] SCR-043 Goal detail:
  - Goal header
  - Outcome expected
  - Linked activities list with status (sortable)
  - Linked projects list
  - - Vincular más buttons → GoalLinkPicker (ISSUE-041)
  - Footer: "Editar" + "Cambiar status ↓" controls
- [ ] Progress calc:
  - For each Goal: `% = (sum of done activities + completed projects) / (total linked activities + projects)`
  - Show "—" si no hay linked items

## Acceptance Criteria

```gherkin
Scenario: View quarter goals
  Given user con 2 quarter goals
  When she opens /goals (default tab=quarter)
  Then both goal cards listed con progress bars

Scenario: Tab change persists in URL
  Given /goals?scope=quarter
  When she taps "Year" tab
  Then URL becomes /goals?scope=year
  And year goals shown

Scenario: Progress calculation
  Given goal con 5 linked activities, 3 done
  Then progress = 60%

Scenario: Goal detail edit
  Given goal "Lanzar MVP" open
  When user taps "Editar"
  Then edit form shows (similar to create modal)
```

## Definition of Done

- [ ] Tabs functional con URL state
- [ ] Progress accurate
- [ ] Goal detail responsive
- [ ] V2 tabs (5-Year / Life) visible but disabled con tooltip "v2"
