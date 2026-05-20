---
id: ISSUE-074
title: Voice capture sheet (SCR-050) — recording + preview + edit + confirm flow
epic: EPIC-VOICE
milestone: v1.0
priority: P1
story_points: 4
status: ready
dependencies: [ISSUE-070, ISSUE-071, ISSUE-072, ISSUE-073]
user_stories: [US-072]
features: [FT-074]
screens: [SCR-050]
business_rules: []
agents: [frontend-specialist]
skills: [/frontend]
components: [CMP-074, CMP-075]
---

# ISSUE-074 — Voice capture sheet UI

## Overview

Build CMP-074 VoiceCaptureSheet — bottom sheet (mobile) / centered modal (desktop). Two states: recording (waveform + transcript stream) → preview (parsed task + edit/confirm).

## Tasks

- [ ] CMP-074 VoiceCaptureSheet:
  - Bottom sheet (mobile, drag-to-close) usando `vaul` library
  - Centered modal (desktop, max 480px wide)
  - State 1 — Recording:
    - Status text "🎙️ Escuchando..."
    - Waveform animation (CMP-076)
    - Live transcript italic serif
    - Buttons: [Cancelar] [Listo →]
  - State 2 — Preview (after parse-task returns):
    - Headline serif "Confirmá la tarea"
    - Form fields: title (editable), project (select con alternatives), date/time, priority dots
    - Confidence indicator si project disambiguation
    - Buttons: [Cancelar] [Editar más] [Guardar →]
- [ ] CMP-075 VoicePreviewCard reusable
- [ ] On Confirm: call createActivity Server Action → close sheet → Toast "Guardado." con undo
- [ ] On Edit Más: open full ActivityDetail form pre-filled
- [ ] On Cancel: discard, no DB write
- [ ] Hide FAB cuando sheet open (ISSUE-070 wiring)

## Acceptance Criteria

```gherkin
Scenario: Full happy path
  Given user taps mic FAB
  When sheet opens en recording state
  When she dictates + Listo
  Then sheet evolves to Preview state con parsed fields
  When user taps Guardar
  Then activity created + sheet closes + Toast "Guardado."

Scenario: Edit field inline
  Given preview state
  When user changes project dropdown to "Empresa Genomma"
  Then field updates immediately (no extra LLM call)
  When user saves
  Then activity created con corrected project

Scenario: "Editar más"
  Given preview state
  When user taps "Editar más"
  Then redirect to /activities/new con form pre-filled

Scenario: Cancel anytime
  Given sheet open en either state
  When user taps Cancelar or drags sheet down
  Then sheet closes, NO DB write
```

## Definition of Done

- [ ] Bottom sheet UX smooth mobile
- [ ] Desktop modal centered
- [ ] Form fields all editable
- [ ] Undo toast 4s post-save
- [ ] Accessible (keyboard nav focus trap en modal)
