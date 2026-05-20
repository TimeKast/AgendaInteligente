---
id: EPIC-AI-AGENT
title: Agente IA core (Claude + system prompt + intensity modes + chat UI)
milestone: v1.0
priority: P0
status: ready
story_points: 35
issues: [ISSUE-050, ISSUE-051, ISSUE-052, ISSUE-053, ISSUE-054, ISSUE-055, ISSUE-056]
features: [FT-050, FT-051, FT-052, FT-053, FT-054, FT-055, FT-056]
user_stories: [US-050, US-051, US-052, US-053]
business_rules: [AI-1, AI-2, AI-3, AI-5, AI-6, AI-7, AI-8, AI-9, OPS-4]
screens: [SCR-023, SCR-031, SCR-058]
---

# EPIC-AI-AGENT — Agente IA core

## Goal

Implement the conversational agent with consistent personality, intensity modes, idioma awareness, out-of-scope redirects, and crisis exit protocol. Foundation para EPIC-CHALLENGES y EPIC-CHECKINS.

## Why this matters

El agente ES el diferenciador del producto. Sin agente bien implementado, AgendaInteligente es una to-do list más. AI-8 (crisis exit) es safety-critical para v1 launch.

## Dependencies

- EPIC-AUTH (User table + scopedDb)
- EPIC-SHEETS (agent puede leer/escribir sheets — tool calls)
- EPIC-ORG (agent puede crear/actualizar activities — tool calls)

## Issues

| ID        | Title                                                                                            | SP  | Priority |
| --------- | ------------------------------------------------------------------------------------------------ | --- | -------- |
| ISSUE-050 | Anthropic SDK setup + system prompts (agent-base, morning/evening/weekly rituals)                | 5   | P0       |
| ISSUE-051 | Conversation + Message schema + chat threading per día                                           | 3   | P0       |
| ISSUE-052 | Chat UI (SCR-023) — message list + input + SSE streaming                                         | 8   | P0       |
| ISSUE-053 | AI tools schemas (save_sheet_field, create_activity, update_activity_status, etc) — AI-9         | 5   | P0       |
| ISSUE-054 | Intensity modes (Sharp/Standard/Gentle/Listening) + Settings UI SCR-031 + auto-revert cron       | 5   | P1       |
| ISSUE-055 | Out-of-scope redirect (AI-7) + idioma matching (AI-1) + voice principles (AI-2..6)               | 3   | P1       |
| ISSUE-056 | Crisis exit protocol (AI-8) + SCR-058 + crisis line lookup table + E2E-013 (BLOCKING for launch) | 6   | P0       |
