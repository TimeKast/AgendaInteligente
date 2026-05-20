---
id: ISSUE-033
title: Week screen (SCR-021) + WeekSheet + 7-day carousel/grid
epic: EPIC-SHEETS
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-031, ISSUE-032]
user_stories: [US-033, US-034, US-035]
features: [FT-034, FT-035, FT-036]
screens: [SCR-021]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-061, CMP-063, CMP-064]
---

# ISSUE-033 — Week screen

## Overview

Build Week screen (SCR-021) con WeekSheet (kickoff Sunday + review Saturday fields) y 7-day grid/carousel showing plan vs ejecutado.

## Tasks

- [ ] CMP-061 WeekSheetView:
  - Header: serif "Semana 19-25 mayo" (date range)
  - Kickoff section: one_thing, three_wins (3 inputs), calendar_blocks (placeholder for FLW-006 implementation), people_to_connect, learn_one, avoid_one, self_care (4 fields)
  - Review section (Saturday onwards): review_wins, review_lessons, review_energy slider 1-10, review_one_sentence
  - review_post_mortem (read-only rich card) — populated por EPIC-CHECKINS post-mortem job
- [ ] CMP-063 WeekGrid (mobile carousel, desktop 7-col grid):
  - 7 day cards
  - Each card: date + scope chip + completion badges + win count + activities preview + "Ver día →" CTA
  - Today highlighted con accent bar
- [ ] CMP-064 DayCard (used inside WeekGrid)
- [ ] Tap day → navigate `/today` con `?date=YYYY-MM-DD` to view that DaySheet
- [ ] Historical weeks accessible via `/week/[week_starting]`
- [ ] Empty state si WeekSheet sin kickoff yet: italic serif "La semana arranca el domingo a las 18:00. ¿Empezar el kickoff ahora?" + CTA

## Acceptance Criteria

```gherkin
Scenario: View current week
  Given user has WeekSheet con three_wins set
  When she navigates to /week
  Then sees kickoff section filled, review section empty, 7 day cards in carousel

Scenario: Tap day card
  Given Tuesday card visible
  When user taps
  Then navigates to /today?date=2026-05-20
  And shows that day's DaySheet + activities (read-only past)

Scenario: Past week
  Given user wants to revisit last week
  When she navigates to /week/2026-05-11
  Then shows that week's sheet (read-only by default, "Editar" toggle disponible)

Scenario: Empty kickoff
  Given Sunday morning, WeekSheet exists pero sin kickoff data
  Then empty state shows con CTA "Empezar kickoff" → opens chat con context=weekly_kickoff (later wired by EPIC-CHECKINS)
```

## Definition of Done

- [ ] Mobile carousel swipe + desktop grid both work
- [ ] Past week navigation works
- [ ] Layout responsive
