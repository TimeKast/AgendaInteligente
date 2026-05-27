---
id: ISSUE-131b
title: MonthSheet UI — /month page + MonthGrid + MonthSheetPanel + drag-and-drop
epic: EPIC-SHEETS
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-131, ISSUE-134]
user_stories: [US-131]
features: [FT-131]
screens: [SCR-026]
business_rules: [BR-7, BR-19]
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-132, CMP-133]
---

# ISSUE-131b — MonthSheet UI

Slice A1 of ISSUE-131 shipped the schema + helper + actions + 28 tests. This issue ships the UI.

## Tasks

- [ ] `app/(agendaInteligente)/month/page.tsx` — server component, loads `getOrCreateMonthSheet` for the current month.
- [ ] CMP-132 `MonthGrid`:
  - 7×5/6 calendar layout with one `MonthDayCell` per day.
  - Each cell: day number + count of activities + 3 colored dots (top 3 projects by count, project color).
  - Month picker (month/year) header with prev/next arrows.
- [ ] `MonthDayCell` interactivity:
  - Tap → opens `DayActivitiesSheet` (modal/sheet with activities for that day).
  - Drag-and-drop activity between days → `moveActivityDate` action.
- [ ] CMP-133 `MonthSheetPanel`:
  - "Una cosa del mes" (single-line input)
  - Themes — editable chips (max 5)
  - Wins mensuales (optional, max 3)
  - "Evitar" textarea
  - "Cerrar mes" button → `closeMonth` action
- [ ] "Congelar plan mensual" button defers to ISSUE-141 (PlanSnapshot).

## Definition of Done

- [ ] Mobile-first responsive (375px baseline)
- [ ] Component tests for grid + drag-and-drop with mocked actions
- [ ] Month picker keyboard navigation
- [ ] E2E smoke: open /month, edit theme, close month
