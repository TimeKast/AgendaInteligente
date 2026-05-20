---
id: ISSUE-060
title: Vague-language challenge — trigger words ES + EN + challenge prompt
epic: EPIC-CHALLENGES
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-050, ISSUE-052, ISSUE-054]
user_stories: [US-060]
features: [FT-060, FT-065]
screens: [SCR-023]
business_rules: [AI-2]
agents: [backend-specialist]
skills: [/backend]
components: [CMP-077]
---

# ISSUE-060 — Vague-language challenge

## Overview

Most important challenge type. Detects vague language en user responses durante rituals + free chat. Agent reprerguntá concretamente. Frequency depends on intensity_mode.

## Tasks

- [ ] Domain function en [src/lib/domain/challenge-detect.ts](../../../../src/lib/domain/challenge-detect.ts):
  ```ts
  function detectVagueLanguage(
    text: string,
    lang: 'es' | 'en'
  ): { isVague: boolean; triggerWords: string[] };
  ```
- [ ] Trigger words ES: mejor, más, pronto, eventualmente, intenté, podría, tal vez, bien, fine, okay, ideal, trabajar en, enfocar en
- [ ] Trigger words EN: better, more, soon, eventually, try, fine, okay, good, ideally, work on, focus on, properly, really
- [ ] Use word boundary regex + lowercase
- [ ] System prompt instructs agent: "Si user respondió con vague language, repreguntá concretamente. NO acepts hasta que user dé concreto. Ejemplos en system prompt."
- [ ] Backend gate: if `intensity_mode='listening'` → skip challenge (system prompt context var)
- [ ] CMP-077 ChallengeIndicator: small inline meta "⚡ challenge: vague_language" en agent message (subtle ink-hint caption)
- [ ] Persist `challenges_fired: ['vague_language']` en message row para analytics
- [ ] Eval set (A-001): 30 ES + 30 EN prompts con vague language → ≥80% triggered correctly. 30 control prompts con concrete → 0 false positives.

## Acceptance Criteria

```gherkin
Scenario: Vague in morning ritual
  Given user en morning ritual intensity=standard
  When she answers "estar más enfocado hoy"
  Then agent does NOT accept
  Repreguntá: "¿Qué significa eso concretamente? Nombrá una cosa visible desde afuera."
  Message persisted con challenges_fired=['vague_language']

Scenario: Listening mode skips
  Given user en intensity='listening'
  When answers vague
  Then agent accepts as-is, no challenge

Scenario: Concrete answer accepted
  Given user answers "terminar el reporte trimestral antes de las 13"
  Then no challenge fires, agent moves to next question

Scenario: Pushback acceptance after concretization
  Given agent challenged, user responds "no, eso es lo que quise decir"
  Then agent: "Está bien. ¿Cómo lo vamos a saber al final del día?" (presses once)
  Si user da algo concreto → accept
  Si user dice "no sé" → record Working Hypothesis + move on
```

## Definition of Done

- [ ] detectVagueLanguage function tested unit (≥80% accuracy)
- [ ] Eval A-001 passing
- [ ] Telemetry of fired challenges
- [ ] No false positives en control set
