---
id: EPIC-VOICE
title: Captura por voz (Web Speech API + Whisper fallback + LLM parse + preview)
milestone: v1.0
priority: P1
status: ready
story_points: 22
issues: [ISSUE-070, ISSUE-071, ISSUE-072, ISSUE-073, ISSUE-074]
features: [FT-070, FT-071, FT-072, FT-073, FT-074, FT-075]
user_stories: [US-070, US-071, US-072, US-073]
business_rules: [BR-13, AI-9]
risks: [R-T-001, R-T-004, R-P-005]
screens: [SCR-020, SCR-050]
---

# EPIC-VOICE — Captura por voz

## Goal

Captura frictionless: tap mic → STT (Web Speech primary, Whisper fallback) → LLM parse → preview con confirm. North Star Pillar 1 del producto.

## Why this matters

Sin captura frictionless, el producto pierde su diferenciador. R-T-001 (Web Speech coverage) y R-P-005 (parse accuracy) son risks asociados.

## Dependencies

- EPIC-AUTH (UsageMeter tracking)
- EPIC-ORG (activities API para create + project lookup)
- EPIC-AI-AGENT (Claude SDK setup + tool patterns)

## Issues

| ID        | Title                                                                               | SP  | Priority |
| --------- | ----------------------------------------------------------------------------------- | --- | -------- |
| ISSUE-070 | FAB mic component + Today/Week/Goals integration + permission management            | 3   | P1       |
| ISSUE-071 | Web Speech API integration + streaming transcript UI                                | 5   | P1       |
| ISSUE-072 | Whisper API fallback + `/api/voice/transcribe` route + usage_meter tracking + BR-13 | 5   | P1       |
| ISSUE-073 | LLM parse-task: `/api/ai/parse-task` + Claude Haiku tool + project disambiguation   | 5   | P1       |
| ISSUE-074 | Voice capture sheet (SCR-050) — recording + preview + edit + confirm flow           | 4   | P1       |
