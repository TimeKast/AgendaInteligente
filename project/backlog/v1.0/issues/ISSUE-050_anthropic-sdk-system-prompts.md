---
id: ISSUE-050
title: Anthropic SDK setup + system prompts (agent-base + ritual variants)
epic: EPIC-AI-AGENT
milestone: v1.0
priority: P0
story_points: 5
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-001]
follow_ups: [ISSUE-050b, ISSUE-050c]
user_stories: [US-051]
features: [FT-051, FT-054]
screens: []
business_rules: [AI-1, AI-2, AI-3, AI-5, AI-6]
agents: [backend-specialist]
skills: [/backend, /architect]
---

# ISSUE-050 — Anthropic SDK + system prompts

## Overview

Setup Anthropic Claude client en [src/lib/ai/client.ts](../../../../src/lib/ai/client.ts). Define system prompts modulares en [src/lib/ai/system-prompts/](../../../../src/lib/ai/system-prompts/) para agent-base, morning-ritual, evening-ritual, weekly-kickoff, weekly-review, voice-parser.

## Tasks

- [ ] Install `@anthropic-ai/sdk` (already en ISSUE-001)
- [ ] Client setup: model = `claude-sonnet-4-6` por default, `claude-haiku-4-5` para voice parsing
- [ ] Enable prompt caching para system prompts largos (Claude caches automáticamente bloques >1024 tokens si configurado)
- [ ] System prompt `agent-base.ts`:
  - Embed voice principles (AI-1..6 textually)
  - Embed crisis exit protocol (AI-8)
  - Embed out-of-scope policies (AI-7)
  - Embed user's onboarding_context si available
  - Embed user's intensity_mode (template variable)
  - Embed preferred_language (template variable)
- [ ] Variant prompts (extend agent-base):
  - `morning-ritual.ts`: pregunta sequence intention → gratitude → identity → 3 wins → avoidance → energy
  - `evening-ritual.ts`: evening_win → evening_lesson → tomorrow_top → insight (opt)
  - `weekly-kickoff.ts`: one_thing → 3_wins → calendar_blocks → people → learn → avoid → self_care
  - `weekly-review.ts`: day-by-day walkthrough + energy + one_sentence + generate post-mortem
  - `voice-parser.ts`: parse text → structured task (tool call schema)
- [ ] Telemetry: log every LLM call with token counts → `usage_meters.ai_tokens_input/output`
- [ ] Cost tracking helper: estimate $/call y aggregate per user

## Acceptance Criteria

```gherkin
Scenario: System prompt loads with user context
  Given user A con intensity_mode='gentle', preferred_language='es', onboarding_context='olvidos'
  When agent.invoke is called
  Then system prompt rendered con todas estas vars sustituidas
  And first message in español, gentle tone

Scenario: Prompt caching reduces cost
  Given large system prompt
  When 10 sequential calls same user
  Then tokens billed reduce after 1st call (prompt cache hit)

Scenario: Voice parser uses Haiku
  Given a voice parse call
  Then model selected = claude-haiku-4-5 (cheaper)
  And response time < 1.5s p50
```

## Definition of Done

- [ ] All 6 system prompt files written and version-controlled
- [ ] Prompt caching enabled and verified via Anthropic dashboard
- [ ] Token tracking writing to usage_meters
- [ ] Tests for prompt template variable substitution
- [ ] Documentation en `src/lib/ai/README.md` con eval methodology

## Technical Notes

- System prompts viven como TypeScript strings (no markdown files) → permite template vars
- Mantener prompts <3000 tokens cada uno para latency budget
- Cuando Sonnet 4.7 estable → upgrade default model en client config (one-liner)
- Anti-pattern: NO embed user data (current activities, sheets) en system prompt — eso va en `messages` array por turn
