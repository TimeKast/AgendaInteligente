---
id: ISSUE-092
title: Display busy slots en Week planning + warning en activity scheduling
epic: EPIC-CALENDAR
milestone: v1.0
priority: P1
story_points: 4
status: ready
dependencies: [ISSUE-033, ISSUE-091]
user_stories: [US-091]
features: [FT-092]
screens: [SCR-021, SCR-040]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
---

# ISSUE-092 — Busy slots UI

## Overview

Show Google Calendar busy slots durante WeekSheet planning. Warning si user agendá activity en slot ocupado. Visual treatment per DD-pattern-6.

## Tasks

- [ ] In Week screen (SCR-021), when WeekSheet kickoff agent asks calendar_blocks:
  - Agent reads CalendarBusySlot rows for the week
  - Shows occupied slots con striped bg + event title (e.g., "Reunión clientes 10-11 lunes")
  - Suggests free slots con CTA "Agendar en este horario"
- [ ] In Activity detail (SCR-040), si user sets scheduled_date + scheduled_time que cae en busy slot:
  - Inline warning "Tenés [evento] a esa hora"
  - User can proceed anyway (not blocking)
- [ ] Helper `getBusySlots(userId, dateRange)`: queries cache table; fast read
- [ ] If user NO conectó Google Calendar: this UI hidden (no warnings, no busy display)

## Acceptance Criteria

```gherkin
Scenario: Weekly kickoff shows busy slots
  Given user has Google Calendar connected + has event Lun 10-11
  When agent en kickoff asks calendar_blocks
  Then agent message includes: "Tenés 'Reunión clientes' lunes 10-11. ¿Qué hacés con esa franja?"

Scenario: Activity overlap warning
  Given activity con scheduled_date=lun, scheduled_time=10:30
  And busy slot Lun 10-11
  Then activity detail shows inline warning "Tenés un evento Google a esa hora"
  User can save anyway

Scenario: No connection, no warnings
  Given user sin Google Calendar conectado
  Then no warnings ever show
  UI clean
```

## Definition of Done

- [ ] Visual treatment matches DD-pattern-6
- [ ] Warning copy en voz neutra
- [ ] Performance: query cached slots <50ms
