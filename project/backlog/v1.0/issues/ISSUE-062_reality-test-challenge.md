---
id: ISSUE-062
title: Reality test challenge para nuevos commitments + scope-down flow
epic: EPIC-CHALLENGES
milestone: v1.0
priority: P1
story_points: 4
status: in_progress
slice_a1_completed_date: 2026-05-26
dependencies: [ISSUE-050, ISSUE-052, ISSUE-060]
user_stories: [US-062]
features: [FT-062]
screens: [SCR-023]
business_rules: []
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-062 — Reality test challenge

## Overview

Cuando user se compromete a algo nuevo (verbo + commitment phrasing), agent pregunta probabilidad real de lograrlo. Si user dice <70%, agent sugiere scope down.

## Tasks

- [ ] Trigger detection: phrases como "voy a [verbo]", "me comprometo a", "esta semana hago", "el próximo mes voy a"
- [ ] System prompt: cuando trigger detected en sharp/standard mode:
  - Ask: "Honestamente — ¿probabilidad real de hacerlo en los próximos 30 días?"
  - If user says <70: "Entonces lo bajamos. ¿Qué versión le pondrías 90%?"
  - If user says ≥70: accept commitment
  - Loop scope-down 1-2 times max si user keeps saying <70
- [ ] Optional: persist probability estimate como field en activity/goal note ("user said 60% probability at creation")
- [ ] Intensity gating: sharp + standard only. Gentle = ocasional. Listening = nunca.
- [ ] Eval A-003: 10 prompts con commitments → ≥80% triggered.

## Acceptance Criteria

```gherkin
Scenario: New commitment triggers reality test
  Given user en standard mode says "voy a ir al gym 5 veces esta semana"
  When agent processes
  Then asks "Honestamente — ¿probabilidad real de hacerlo?"

Scenario: <70 triggers scope-down
  Given user responds "como 40%"
  Then agent suggests scope down: "¿Qué versión le pondrías 90%?"

Scenario: User scopes down
  Given user says "ir 2 veces"
  Then agent accepts, helps create activity/recurrence con scoped commitment

Scenario: ≥70 accepted
  Given user says "85%"
  Then agent accepts as-is, moves to action

Scenario: Multiple scope-downs
  Given user keeps saying low %
  Then max 2 scope-down iterations
  After 2nd, agent: "OK, lo dejamos así por ahora. Si no se logra, hablamos."
```

## Definition of Done

- [ ] Reality test triggered correctly (eval A-003 ≥80%)
- [ ] Scope-down flow functional
- [ ] Probability stored en context (for v1.5 pattern detection)
