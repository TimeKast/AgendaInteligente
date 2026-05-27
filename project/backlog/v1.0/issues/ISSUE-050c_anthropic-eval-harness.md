---
id: ISSUE-050c
title: AI eval harness + src/lib/ai/README.md (eval methodology)
epic: EPIC-AI-AGENT
milestone: v1.0
priority: P2
story_points: 1
status: completed
completed_date: 2026-05-27
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

- [x] `tests/ai-eval/golden/voice-principles.json` — 19 fixtures (5 ES pass, 7 ES fail, 3 EN pass, 4 EN fail).
- [x] `scripts/tools/ai-eval.ts` — replays fixtures against `lintAgentReply`, exit 1 on any regression.
- [x] `src/lib/ai/README.md` — layout + eval methodology + cost guardrails.
- [x] `pnpm ai:eval` script in package.json.

## Implementation Evidence

- Commits: `d324dbb` (harness + fixtures), `115061b` (README).
- `pnpm ai:eval` → 19/19 (100%).
- Voice contract frozen — runner exits non-zero on any regression.

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
