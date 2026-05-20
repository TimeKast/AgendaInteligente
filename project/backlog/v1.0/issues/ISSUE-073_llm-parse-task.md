---
id: ISSUE-073
title: LLM parse-task — /api/ai/parse-task + Claude Haiku tool + project disambiguation
epic: EPIC-VOICE
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-050, ISSUE-053, ISSUE-071, ISSUE-072]
user_stories: [US-072]
features: [FT-073, FT-100]
screens: [SCR-050]
business_rules: [AI-9]
risks: [R-P-005]
agents: [backend-specialist]
skills: [/backend]
---

# ISSUE-073 — LLM parse text → structured task

## Overview

After STT (Web Speech or Whisper), text is sent to `/api/ai/parse-task` que usa Claude Haiku + `create_activity_preview` tool para extract structured task. Returns preview + alternatives. Project disambiguation: if title mentions a category name, best-match en user's categories + alternatives.

## Tasks

- [ ] Route Handler `POST /api/ai/parse-task`:
  - Auth required, rate limit 200/hour per user
  - Input: `{ text: string }`
  - Context loaded server-side: user's active categories + projects (names + ids), today's date, user's TZ
  - Call Claude Haiku con system prompt voice-parser.ts + user message text
  - Tool: `create_activity_preview` returns extracted JSON
  - Disambiguation: si project name partial match, return top match + top 2 alternatives con confidence scores
  - Increment usage_meters.ai_calls_count + tokens
  - Return preview + alternatives JSON (no DB write)
- [ ] System prompt voice-parser.ts:
  - Embed user's categories/projects list (template var)
  - Instructions: extract title, project_id_suggestion + project_name_match (best of user's projects), scheduled_date (parse relative dates: "mañana" → tomorrow's date), scheduled_time, priority (if mentioned "alta", "low priority"), deadline, estimated_minutes
  - Examples: 5+ in español
  - Tool call required (AI-9)
- [ ] Eval A-009: 30 synthetic prompts → ≥90% correct extraction
- [ ] Edge cases: ambiguous project (no clear match) → return top 3 with low confidence

## Acceptance Criteria

```gherkin
Scenario: Clear extraction
  Given user dictated "agendá llamar a juan mañana 10am proyecto personal alta prioridad"
  Then preview returned con:
    title: "Llamar a Juan"
    project_name_match: "Personal" (match 0.92)
    scheduled_date: tomorrow
    scheduled_time: "10:00"
    priority: 5

Scenario: Ambiguous project
  Given user has projects "Personal" y "Empresa Genomma"
  And dictated "comprar regalo"
  Then preview returned con project_id_suggestion=Inbox + alternatives showing both projects con low confidence

Scenario: Date parsing relative
  Given dictation "el viernes que viene"
  Then scheduled_date = next Friday in user TZ

Scenario: No priority mentioned
  Given dictation sin priority words
  Then priority = 3 (default), no confidence claim

Scenario: Rate limit
  Given user 201st call in hour
  Then 429
```

## Definition of Done

- [ ] Eval A-009 passing ≥90%
- [ ] Spanish + English both work
- [ ] Date parsing handles "hoy/mañana/el lunes/en 3 días" etc
- [ ] Usage_meters incremented correctly
- [ ] Latency p95 <2s
