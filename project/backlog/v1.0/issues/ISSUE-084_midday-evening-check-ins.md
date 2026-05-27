---
id: ISSUE-084
title: Midday check-in (conditional) + evening check-in
epic: EPIC-CHECKINS
milestone: v1.0
priority: P1
story_points: 4
status: in_progress
slice_a1_completed_date: 2026-05-27
dependencies: [ISSUE-083]
user_stories: [US-081, US-082]
features: [FT-081, FT-082, FT-104]
screens: [SCR-023]
business_rules: []
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-084 — Midday + evening check-ins

## Overview

Midday check-in only fires si DaySheet con wins_planned tiene alguno pendiente (FT-081 conditional). Evening always fires per `evening_time`. FT-104 1-line summary generated en evening close.

## Tasks

- [ ] Inngest function `midday.check_in.due`:
  - Query today's DaySheet for user
  - If `wins_planned` empty OR all wins matched a done activity → SKIP (do not push)
  - Else: enqueueAndSend con payload `{ context: 'midday_check', activity_or_win_id: <first-not-done> }`
  - Push body references specifically: "Dijiste que ibas a [X] hoy. ¿Cómo va?"
- [ ] Inngest function `evening.check_in.due`:
  - Always fires (subject to anti-spam)
  - Push "Cerramos el día?" + opens chat con context=evening_close
- [ ] Chat handler for context=evening_close:
  - System prompt `evening-ritual.ts`
  - 3 questions: evening_win → evening_lesson → tomorrow_top + opt insight
  - Closes with "Buenas noches"
  - Optionally generate 1-line summary (FT-104): "Hiciste 6/8 hoy, mejor que ayer (4/7)" — using simple SQL count comparison
- [ ] DaySheet.evening_completed_at = now al cerrar evening

## Acceptance Criteria

```gherkin
Scenario: Midday fires con win pendiente
  Given DaySheet con wins_planned=["terminar reporte", ...] y reporte not done
  When 13:00 arrives
  Then push: "Dijiste que ibas a 'terminar reporte' hoy. ¿Cómo va?"

Scenario: Midday skipped si todo done
  Given todas las wins planeadas marked done
  When 13:00 arrives
  Then NO push (skip)

Scenario: Evening ritual completo
  Given user opens chat from evening push
  Then agent walks through evening_win → evening_lesson → tomorrow_top
  And optional insight
  Sheet evening fields populated, evening_completed_at = now

Scenario: 1-line summary
  Given user completed 6 of 8 activities hoy
  And yesterday completed 4 of 7
  Then summary text: "Cerraste 6/8 hoy, mejor que ayer."
  Shown en chat o en Today vista del cierre
```

## Definition of Done

- [ ] Both check-ins functional
- [ ] Midday conditional logic tested
- [ ] 1-line summary generated correctamente
- [ ] DaySheet completion timestamps set
