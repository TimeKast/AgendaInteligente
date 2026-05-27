---
id: ISSUE-050c
title: AI eval harness + src/lib/ai/README.md (eval methodology)
epic: EPIC-AI-AGENT
milestone: v1.0
priority: P2
story_points: 1
status: ready
dependencies: [ISSUE-050, ISSUE-050b]
user_stories: []
features: [FT-051]
screens: []
business_rules: [AI-1, AI-2]
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-050c — AI eval harness + docs

## Overview

Documents how we evaluate prompt quality + ships a tiny eval harness so prompt changes can be validated without manual smoke. Lightweight — full LLM-as-judge frameworks (langfuse, etc.) are overkill for v1.

## Tasks

- [ ] `tests/ai-eval/golden/` — JSON fixtures: input messages + ideal output.
- [ ] `scripts/ai-eval.ts` — replay each fixture against the current prompt, assert: (a) no forbidden tokens (vos/tenés/che), (b) AI-3 compliance (no automatic praise tokens), (c) sentence-count budget (AI-6).
- [ ] `src/lib/ai/README.md` — explains:
  - Where prompts live + how to add a new ritual.
  - Eval methodology: golden fixtures, what we test, what we don't.
  - How to interpret usage_meters dashboards.
  - Cost guardrails (alert thresholds).
- [ ] `pnpm ai:eval` script in package.json.

## Acceptance Criteria

```gherkin
Scenario: Eval catches Argentinian voseo regression
  Given a prompt diff that introduces "tenés" into agent-base
  When pnpm ai:eval runs
  Then exits non-zero
  And the failing fixture is reported

Scenario: Eval catches praise regression (AI-3)
  Given a prompt diff that adds "¡excelente!" to morning-ritual
  When pnpm ai:eval runs against the morning fixture
  Then exits non-zero
```

## Definition of Done

- [ ] Eval runs against 5+ fixtures (one per ritual variant)
- [ ] README documents the eval methodology
- [ ] CI integration deferred (eval is a manual gate before prompt changes land)
