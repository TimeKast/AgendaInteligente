---
id: ISSUE-070
title: FAB mic component + Today/Week/Goals integration + permission management
epic: EPIC-VOICE
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-025]
user_stories: [US-070, US-073]
features: [FT-070, FT-075]
screens: [SCR-020, SCR-021, SCR-022]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-005]
---

# ISSUE-070 — FAB mic + permission

## Overview

Build CMP-005 FabMic floating action button (56×56px bottom-right). Integrate en Today/Week/Goals (NOT en Chat — chat has own input). On-demand permission request (NOT en onboarding).

## Tasks

- [ ] CMP-005 FabMic:
  - 56×56px, bottom-right
  - Position: `bottom: calc(--bottom-nav-height + 16px); right: 16px` mobile
  - Desktop: `bottom: 24px; right: 24px`
  - Background: `--accent-primary` (warm charcoal)
  - Icon: Lucide mic, stroke 1.75
  - Pulse animation OFF until recording
- [ ] Integrate en `/today`, `/week`, `/goals` layouts (NOT `/chat`)
- [ ] Tap handler:
  - 1st time: check mic permission state
    - if 'prompt' → trigger browser native mic prompt
    - if 'denied' → modal "Mic denegado. Activá en Settings del browser, o creá con teclado."
    - if 'granted' → open voice capture sheet (SCR-050) — ISSUE-074
- [ ] Persistent recording indicator (visible animation cuando active)
- [ ] Hide FAB cuando voice capture sheet is open (avoid visual conflict)

## Acceptance Criteria

```gherkin
Scenario: First time tap
  Given user has not granted mic
  When she taps FAB
  Then browser shows native mic permission prompt
  If granted: voice capture sheet opens
  If denied: modal informs how to enable

Scenario: Subsequent taps
  Given permission already granted
  When user taps FAB
  Then voice capture sheet opens immediately

Scenario: FAB on Week + Goals
  Given user en /week or /goals
  Then FAB visible bottom-right
  And tap behavior same as Today

Scenario: Not on Chat
  Given user en /chat
  Then no FAB (chat has its own mic in input bar)
```

## Definition of Done

- [ ] Component reusable
- [ ] Permission UX tested mobile + desktop
- [ ] Safe area respect (no overlap home indicator iOS)
- [ ] Hide-when-sheet-open works
