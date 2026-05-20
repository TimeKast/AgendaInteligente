---
id: ISSUE-023
title: Priority 1-5 input + sorting en lists
epic: EPIC-TIME
milestone: v1.0
priority: P0
story_points: 2
status: ready
dependencies: [ISSUE-013, ISSUE-014]
user_stories: [US-024]
features: [FT-025]
screens: [SCR-040, SCR-051, SCR-020]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-035]
---

# ISSUE-023 — Priority + sorting

## Overview

Priority field (1-5, 5=alta). UI con dots (CMP-035) o slider compact. Default 3 si no specified. Today list sorts by priority desc within time_block.

## Tasks

- [ ] CMP-035 PriorityDots:
  - 5 dots; filled per priority
  - Click pasa cíclicamente 1→2→3→4→5→1 (mobile-friendly)
  - Long-press → slider for fine control
- [ ] Default = 3 al crear sin specify
- [ ] Today list ordering:
  - Anchored tasks: by scheduled_time asc
  - Pool tasks: por priority desc, then by created_at asc
- [ ] Color (subtle):
  - 5 (alta): dot color = ink-primary
  - 4: ink-soft
  - 3: ink-hint
  - 2: rule color (warm ecru)
  - 1: rule color but smaller dots

## Acceptance Criteria

```gherkin
Scenario: Set priority
  Given activity con priority=3 default
  When user taps 5th dot
  Then priority = 5
  And actividad sube en lista (sorted by priority desc)

Scenario: Voice priority parse
  Given user dictates "alta prioridad" en voice capture
  Then parse-task sets priority = 5 (handled en EPIC-VOICE)
```

## Definition of Done

- [ ] Component reusable en ActivityCard y ActivityDetail
- [ ] Sorting tested
- [ ] Accessibility: keyboard navigation works
