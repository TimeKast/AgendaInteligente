---
id: ISSUE-061
title: Cost reveal challenge en goal creation flow
epic: EPIC-CHALLENGES
milestone: v1.0
priority: P1
story_points: 3
status: in_progress
slice_a1_completed_date: 2026-05-26
dependencies: [ISSUE-040, ISSUE-060]
user_stories: [US-061]
features: [FT-061]
screens: [SCR-023]
business_rules: []
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-061 — Cost reveal challenge

## Overview

Cuando user crea un goal sin mencionar el costo (qué tiene que dejar de hacer), agente repregunta concretamente.

## Tasks

- [ ] Trigger: durante goal creation conversation (or chat-driven goal create), if user describes goal sin keyword "dejar/give up/sacrificar/menos tiempo en/cambiar X por Y"
- [ ] System prompt instruction (en `agent-base` o specialized goal-creation prompt):
  - "Si user nombra goal sin nombrar costo → preguntar: '¿Qué tenés que dejar de hacer para lograr esto? Tiempo, dinero, comodidad, otra prioridad.'"
- [ ] Persist response to Goal.notes_cost (new field add via migration)
- [ ] Migration: add `notes_cost text NULL` to goals table
- [ ] Intensity gating: only fires en sharp + standard (gentle = occasional, listening = nunca)
- [ ] Telemetry: challenges_fired=['cost_reveal']

## Acceptance Criteria

```gherkin
Scenario: Goal sin cost mentioned
  Given user creates goal "Aprender alemán B1"
  When agent processes
  Then agent asks "¿Qué tenés que dejar de hacer para lograr esto?"

Scenario: User answers cost
  Given agent asked cost
  When user responds "menos Netflix, levantarme 1h antes"
  Then Goal.notes_cost persisted con this text
  And goal saved completo

Scenario: User dodges
  Given user responds "no sé"
  Then agent: "Lo dejamos en blanco por ahora. Lo retomamos en el primer review."
  Goal saved, notes_cost = null
```

## Definition of Done

- [ ] Migration applied (notes_cost field)
- [ ] System prompt updated
- [ ] Eval A-002 passing (≥80% trigger rate)
- [ ] Goal.notes_cost visible en goal detail view
