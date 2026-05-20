---
id: ISSUE-022
title: Deadline separate field + DeadlineBadge (warning si próximo, danger si pasó)
epic: EPIC-TIME
milestone: v1.0
priority: P1
story_points: 2
status: ready
dependencies: [ISSUE-013, ISSUE-014]
user_stories: [US-023]
features: [FT-023]
screens: [SCR-040]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-112]
---

# ISSUE-022 — Deadline + DeadlineBadge

## Overview

Add `deadline` field UI separate from `scheduled_date`. Display via CMP-112 DeadlineBadge with state (normal / warning ≤3 días / danger pasado).

## Tasks

- [ ] DateTime picker en activity form (deadline, optional)
- [ ] CMP-112 DeadlineBadge:
  - Sin deadline: hide badge
  - Deadline > 7 días: gray "vence en N días"
  - Deadline ≤ 7 días y > 3: ink-soft "vence en N días"
  - Deadline ≤ 3 días: `--warning` "vence en N días" (burnt orange ish)
  - Deadline pasado y status ≠ done: `--danger` "venció hace N días"
- [ ] UI rule: si user pone `scheduled_date > deadline`, show inline warning "agendada después del deadline"
- [ ] Telemetry event: deadline_approaching trigger (will be used by EPIC-CHECKINS for risk_alert)

## Acceptance Criteria

```gherkin
Scenario: Deadline future
  Given activity con deadline = today + 5 days
  Then badge "vence en 5 días" en ink-soft

Scenario: Deadline próximo
  Given deadline = today + 2 days
  Then badge "vence en 2 días" en warning color

Scenario: Deadline vencido
  Given deadline = today - 1 day, status=pending
  Then badge "venció hace 1 día" en danger color

Scenario: Scheduled after deadline
  Given deadline = today + 2 days, scheduled_date = today + 5 days
  Then form shows inline warning "agendada después del deadline"
```

## Definition of Done

- [ ] DeadlineBadge component implemented y reused en ActivityCard + ActivityDetail
- [ ] Computation timezone-aware (user TZ)
- [ ] Tests for all 4 states
