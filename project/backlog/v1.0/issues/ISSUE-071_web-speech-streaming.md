---
id: ISSUE-071
title: Web Speech API integration + streaming transcript UI
epic: EPIC-VOICE
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-070]
user_stories: [US-071]
features: [FT-071]
screens: [SCR-050]
business_rules: []
risks: [R-T-001]
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-076]
---

# ISSUE-071 — Web Speech API streaming

## Overview

Use Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) para STT primary path. Streaming transcript visible mientras user habla. Auto-detect language from User.preferred_language.

## Tasks

- [ ] React hook `useWebSpeech(lang)`:
  - Detect support: `'SpeechRecognition' in window || 'webkitSpeechRecognition' in window`
  - Returns: { isSupported, startRecording, stopRecording, transcript, isRecording, error }
  - Config: continuous=true, interimResults=true, lang from User
- [ ] If NOT supported: hook returns `isSupported=false` → caller knows to use Whisper fallback (ISSUE-072)
- [ ] CMP-076 WaveformAnim:
  - Calm animation (no bouncy) using user mic volume input (AudioContext)
  - Renders waveform bars con --ink-soft color
- [ ] Auto-stop:
  - 2s of silence detected → call stopRecording
  - Max recording duration 30s (hard limit)
- [ ] Telemetry: log Web Speech path used vs fallback rate (informs R-T-001 mitigation)

## Acceptance Criteria

```gherkin
Scenario: Web Speech supported
  Given browser supports SpeechRecognition (Chrome/Edge desktop, Chrome Android, Safari iOS 14.5+)
  When user starts recording
  Then transcript streams visible
  And waveform animates con voz

Scenario: Web Speech NOT supported
  Given Firefox or older Safari
  Then useWebSpeech returns isSupported=false
  Caller can switch to Whisper fallback flow

Scenario: Silence auto-stop
  Given recording active
  When 2s of silence
  Then automatically stops, transcript finalized

Scenario: Max duration enforced
  Given recording continues >30s
  Then auto-stop con notice "Captura corta — repetí con menos detalle"

Scenario: Lang detection
  Given User.preferred_language='es'
  Then SpeechRecognition.lang = 'es-MX' (or 'es' fallback)
```

## Definition of Done

- [ ] Hook tested across Chrome desktop + Android + Safari iOS 14.5+
- [ ] Waveform component reusable
- [ ] Telemetry working
- [ ] Fallback signaling for ISSUE-072
