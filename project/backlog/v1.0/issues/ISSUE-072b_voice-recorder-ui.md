---
id: ISSUE-072b
title: Client-side voice recorder (MediaRecorder fallback) + Web Speech detection + UI wiring
epic: EPIC-VOICE
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-072, ISSUE-071]
user_stories: [US-071]
features: [FT-071, FT-072]
screens: [SCR-050]
business_rules: [BR-13]
agents: [frontend-specialist]
skills: [/frontend]
---

# ISSUE-072b — Voice recorder UI

## Overview

Slice A1 of ISSUE-072 shipped the `POST /api/voice/transcribe` backend (Whisper + meter + 12 tests). This issue ships the client-side recording fallback + Web Speech detection logic + UI hooks.

## Tasks

- [ ] `src/hooks/use-voice-recorder.ts`:
  - Detect `window.SpeechRecognition` (or webkit prefix); if present → use Web Speech.
  - Else use MediaRecorder API (preferred MIME audio/webm;codecs=opus, fallback audio/mp4).
  - Cap 30s recording (auto-stop via `setTimeout`).
  - Cap 5MB blob size (abort if exceeded).
  - On stop → POST blob as FormData to `/api/voice/transcribe`.
- [ ] CMP-104 MicButton: hold-to-talk + tap-to-toggle.
- [ ] Visual states: idle / recording (pulsing) / transcribing / error.
- [ ] Permission handling (mic access denied → toast + link to browser settings).
- [ ] Browser compat matrix tested: Chrome / Firefox / Safari (iOS + macOS).

## Acceptance Criteria

```gherkin
Scenario: Chrome with Web Speech available
  Given user on Chrome
  Then hook returns text via Web Speech (no upload)

Scenario: Firefox fallback
  Given user on Firefox (no Web Speech)
  When user records 5s of audio
  Then MediaRecorder produces a webm blob
  And POSTs to /api/voice/transcribe
  And returned text appears in input

Scenario: Mic permission denied
  Given user denies mic permission
  Then UI shows "Permitir micrófono" toast + link to settings

Scenario: 5MB cap
  Given user records > 5MB
  Then recorder aborts + shows "Audio demasiado largo" toast
```

## Definition of Done

- [ ] Hook unit-tested with mocked MediaRecorder
- [ ] CMP-104 component tests (RTL)
- [ ] Manual smoke on Chrome / Firefox / Safari
- [ ] Audio never stored (verified — no upload other than transcribe)
