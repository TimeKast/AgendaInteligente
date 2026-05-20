---
id: EPIC-CHALLENGES
title: Vague-answer + cost reveal + reality test challenges
milestone: v1.0
priority: P1
status: ready
story_points: 12
issues: [ISSUE-060, ISSUE-061, ISSUE-062]
features: [FT-060, FT-061, FT-062, FT-065]
user_stories: [US-060, US-061, US-062]
business_rules: [AI-1, AI-2]
screens: [SCR-023]
---

# EPIC-CHALLENGES — Vague-answer challenges

## Goal

3 challenge tipos críticos del agente: vague-language detection, cost reveal en goals, reality test para nuevos commitments. Frecuencia controlled by intensity_mode. Foundation para v1.5 (repeat detection + identity check).

## Why this matters

Challenges son el motor del producto: convierten excusas vagas en datos accionables. Diferenciador real vs apps pasivas.

## Dependencies

- EPIC-AI-AGENT (chat infrastructure + intensity modes)

## Issues

| ID        | Title                                                               | SP  | Priority |
| --------- | ------------------------------------------------------------------- | --- | -------- |
| ISSUE-060 | Vague-language detection (trigger words ES + EN) + challenge prompt | 5   | P1       |
| ISSUE-061 | Cost reveal challenge en goal creation flow                         | 3   | P1       |
| ISSUE-062 | Reality test challenge para nuevos commitments + scope-down flow    | 4   | P1       |
