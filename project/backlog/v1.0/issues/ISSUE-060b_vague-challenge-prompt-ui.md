---
id: ISSUE-060b
title: Vague-language challenge — prompt integration + CMP-077 indicator + eval set
epic: EPIC-CHALLENGES
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-060, ISSUE-050b, ISSUE-052]
user_stories: [US-060]
features: [FT-060, FT-065]
screens: [SCR-023]
business_rules: [AI-2]
agents: [backend-specialist, frontend-specialist]
skills: [/backend, /frontend]
components: [CMP-077]
---

# ISSUE-060b — Vague challenge prompt + UI

## Overview

Slice A1 (ISSUE-060) shipped the deterministic `detectVagueLanguage` helper + 35 tests. This issue:

1. Threads the detection signal into the chat route (skip when intensity_mode='listening', otherwise pass triggerWords into the ritual prompt context so the agent reasks specifically).
2. Persists `challenges_fired: ['vague_language']` in the message row.
3. Renders CMP-077 ChallengeIndicator inline on agent messages.
4. Eval set A-001 (30 ES + 30 EN vague + 30 control concrete).

## Tasks

- [ ] Wire `detectVagueLanguage` in chat route (depends on ISSUE-052):
  - On user message, run the detector.
  - If `intensity_mode !== 'listening'` AND `isVague=true`, inject `triggerWords` into the ritual prompt so Claude knows which tokens to press on.
  - Persist `challenges_fired: ['vague_language']` on the agent message.
- [ ] CMP-077 ChallengeIndicator (depends on ISSUE-052 chat UI):
  - Inline meta caption "⚡ challenge: vague_language" below the agent message
  - Renders the trigger words detected as a hint
- [ ] Eval set `tests/ai-eval/vague-language.json` — A-001:
  - 30 ES vague phrases (e.g. "mejor", "tal vez", "ahí voy")
  - 30 EN vague phrases
  - 30 concrete control phrases (must NOT trigger)
  - Pass rate ≥80% on vague, 0% false positives
- [ ] Telemetry: count `challenges_fired` per user per period (extend usage_meters or a separate counter — TBD)

## Acceptance Criteria

```gherkin
Scenario: Vague in morning ritual (standard intensity)
  Given user en morning ritual, intensity=standard
  When she answers "estar más enfocado"
  Then chat route detects vague_language with triggers=['mas', 'enfocar en']
  And agent reasks concretely
  And agent message persists with challenges_fired=['vague_language']

Scenario: Listening mode skips
  Given user en intensity='listening'
  When answers vague
  Then chat route SKIPS the challenge (no triggerWords passed to LLM)
  And agent accepts as-is

Scenario: Concrete answer accepted
  Given user answers "terminar el reporte trimestral antes de las 13"
  Then no challenge fires
```

## Definition of Done

- [ ] Chat route integration tested with mock LLM
- [ ] CMP-077 component tests
- [ ] Eval A-001 passing ≥80% recall, 0% FP
- [ ] Telemetry counter wired
