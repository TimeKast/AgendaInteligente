---
id: ISSUE-050b
title: Anthropic ritual prompts (morning, evening, weekly-kickoff, weekly-review, voice-parser)
epic: EPIC-AI-AGENT
milestone: v1.0
priority: P1
story_points: 2
status: completed
completed_date: 2026-05-27
completion_note: voice-parser already shipped in ISSUE-073. Multi-turn tool loop in chat route remains in ISSUE-052b.
dependencies: [ISSUE-050]
user_stories: [US-051]
features: [FT-051, FT-054]
screens: []
business_rules: [AI-1, AI-2]
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-050b — Ritual system prompt variants

## Overview

Continuation of ISSUE-050. Slice A1 shipped `agent-base.ts` + client + telemetry. This issue adds the 5 ritual-specific prompts that extend agent-base.

## Tasks

- [ ] `src/lib/ai/system-prompts/morning-ritual.ts` — sequence intention → identity_statement → 3 wins → avoidance.
- [ ] `src/lib/ai/system-prompts/evening-ritual.ts` — close-day single-question flow → close_summary.
- [ ] `src/lib/ai/system-prompts/weekly-kickoff.ts` — one_thing → 3_wins → calendar_blocks → people → learn → avoid → self_care.
- [ ] `src/lib/ai/system-prompts/weekly-review.ts` — day-by-day walkthrough + energy + one_sentence + post-mortem generation.
- [ ] `src/lib/ai/system-prompts/voice-parser.ts` — parse free-text → structured activity (tool call schema with title, scheduled_dates, scheduled_time, duration_minutes, priority, quadrant).
- [ ] Each variant accepts `AgentBaseContext` + ritual-specific args (e.g. weekly-review takes the DaySheet rollups for the past 7 days).
- [ ] Update `client.ts` `invoke()` to support `tools` array (for voice-parser).
- [ ] Tests: render snapshot per variant (input → expected sections) + 1 happy-path tool-call test for voice-parser.

## Acceptance Criteria

```gherkin
Scenario: morning-ritual fires with user context
  Given user en gentle mode, español
  When morning-ritual prompt is rendered
  Then incluye sección intention con anchor "Una intención, en una frase"
  And el tono refleja el gentle guide (sin desafío a respuestas vagas)

Scenario: voice-parser uses Haiku + tool calling
  Given voice text "almuerzo con maria el viernes a las 13"
  When invoke called con voice-parser prompt + tools=[parse_activity]
  Then model = claude-haiku-4-5
  And tool_use block emitted con structured activity
```

## Definition of Done

- [ ] 5 prompt files version-controlled
- [ ] Render snapshot tests for each variant
- [ ] Voice-parser tool-call test passes against a recorded fixture
- [ ] Prompt caching verified via Anthropic dashboard
- [ ] `invoke()` extended to handle `tool_use` content blocks
