---
id: ISSUE-021
title: time_blocks multi-select (morning / afternoon / evening)
epic: EPIC-TIME
milestone: v1.0
priority: P1
story_points: 2
status: ready
dependencies: [ISSUE-020]
user_stories: [US-022]
features: [FT-022]
screens: [SCR-040, SCR-020]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
---

# ISSUE-021 — Time blocks aspiracionales

## Overview

Multi-select chips (morning / afternoon / evening) per activity. Activity puede ocupar varios bloques (X7 resolved). Today view groups pool tasks by block.

## Tasks

- [ ] UI: 3 chip toggles en activity form/detail "🌅 Mañana / ☀️ Tarde / 🌙 Noche"
- [ ] Multi-select (puede haber ≥1 seleccionado)
- [ ] DB: text[] field already en schema (E-005)
- [ ] Today view (SCR-020) grouping logic:
  - Anchored tasks (scheduled_time NOT NULL) first, sorted by time
  - Pool tasks grouped por time_block: Morning / Afternoon / Evening / Anytime (sin block)
  - Within group, sorted by priority desc

## Acceptance Criteria

```gherkin
Scenario: Activity en múltiples bloques
  Given activity "Estudiar alemán"
  When user marks both "Mañana" y "Noche"
  Then time_blocks = ['morning', 'evening']
  And en Today appears in both Morning section y Evening section

Scenario: Sin time block
  Given activity sin time_blocks
  Then aparece en "Anytime" section al final del día

Scenario: Anchored task no necesita block
  Given activity con scheduled_time = "10:00"
  Then appears en time-ordered section, no en block sections
```

## Definition of Done

- [ ] Multi-select UI tested mobile
- [ ] Grouping correcto en Today view
- [ ] Same activity en multiple sections no muestra duplicado al DB (single row, multiple references)
