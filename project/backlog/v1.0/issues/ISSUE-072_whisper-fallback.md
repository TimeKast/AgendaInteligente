---
id: ISSUE-072
title: Whisper API fallback + /api/voice/transcribe + usage_meter tracking + BR-13
epic: EPIC-VOICE
milestone: v1.0
priority: P1
story_points: 5
status: in_progress
slice_a1_completed_date: 2026-05-27
dependencies: [ISSUE-001, ISSUE-002, ISSUE-071]
follow_ups: [ISSUE-072b]
user_stories: [US-071]
features: [FT-072]
screens: [SCR-050]
business_rules: [BR-13, OPS-9]
risks: [R-T-004, R-T-007]
agents: [backend-specialist, security-auditor]
skills: [/backend, /security]
---

# ISSUE-072 — Whisper fallback

## Overview

Para browsers sin Web Speech API (Firefox, older Safari), record audio blob client-side → upload to `/api/voice/transcribe` → Whisper API → return text. Audio NEVER persisted (BR-13).

## Tasks

- [ ] Client-side recording fallback:
  - Use MediaRecorder API
  - Format: webm/opus o mp4/aac depending on browser
  - Max 30s, max 5MB
- [ ] Route Handler `POST /api/voice/transcribe`:
  - Auth required (requireAuth)
  - Rate limit: 60/hour per user (Upstash Redis)
  - Accept multipart/form-data con field `audio`
  - Validate size + MIME
  - Call OpenAI Whisper API
  - Return `{ text: string }`
  - Increment `usage_meters.whisper_seconds_count` con audio duration
  - **NEVER write audio to storage** (BR-13)
- [ ] Error handling:
  - 401 si not auth
  - 413 si payload >5MB
  - 415 si not audio MIME
  - 429 si rate limited
  - 502 si Whisper API errors
- [ ] Client glue: if Web Speech unavailable → use MediaRecorder → POST to transcribe → use returned text

## Acceptance Criteria

```gherkin
Scenario: Successful fallback transcription
  Given Firefox user records 10s audio
  When POST /api/voice/transcribe with blob
  Then Whisper API called, text returned <4s
  And usage_meters.whisper_seconds_count += 10

Scenario: Audio not persisted
  Given any transcribe call
  Then NO write to S3/storage
  And no audio file en filesystem post-request

Scenario: Rate limit
  Given user has done 60 transcriptions in last hour
  When 61st request
  Then 429 + Retry-After header

Scenario: Whisper API down
  Given Whisper returns 503
  Then route returns 502 con user-facing error
  Client shows: "El servicio de transcripción no está disponible. Tipeá la tarea en su lugar."

Scenario: Multi-tenant audit (BR-1)
  Given userA's session
  When transcribe called
  Then user_id = A en usage_meters increment
  No leak between users
```

## Definition of Done

- [ ] Whisper integration working
- [ ] Audio NEVER persisted (verified en code review + integration test I-027)
- [ ] Rate limits tested
- [ ] Telemetry: % of captures via Whisper vs Web Speech (informs R-T-001 mitigation)
- [ ] Cost monitor: alert si Whisper monthly cost > threshold
