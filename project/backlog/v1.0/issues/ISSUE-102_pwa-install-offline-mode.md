---
id: ISSUE-102
title: PWA install prompts (Android native + iOS instructional) + offline mode básico
epic: EPIC-PWA-SETTINGS
milestone: v1.0
priority: P1
story_points: 4
status: ready
dependencies: [ISSUE-001, ISSUE-081]
user_stories: [US-120, US-121]
features: [FT-120, FT-121]
screens: [SCR-056]
business_rules: []
risks: [R-T-009]
agents: [frontend-specialist]
skills: [/frontend]
---

# ISSUE-102 — PWA install + offline

## Overview

Web app manifest + service worker para install prompts. Native install banner Android Chrome. iOS instructional sheet (no install API). Offline mode básico: lectura del día + creación de tasks que se sincronizan al volver online.

## Tasks

- [ ] `manifest.json`:
  - name, short_name, description, icons (192, 512, maskable)
  - theme_color: `#FBF7EF` (cream)
  - background_color: `#FBF7EF`
  - display: 'standalone'
  - start_url: '/today'
  - scope: '/'
- [ ] Service worker (extending TimeKast existing):
  - Workbox o vanilla
  - Cache strategy:
    - Shell (HTML, CSS, JS) → stale-while-revalidate
    - Today's DaySheet + activities → cache first con background sync
    - API calls (auth, mutations) → network first
- [ ] Install prompt UX:
  - **Android**: capture `beforeinstallprompt` event, show custom banner CMP-031 con "Instalar app" CTA después de 3 sesiones OR 7 días
  - **iOS Safari**: show SCR-056 instructional modal (no install API) — "Tap ⎙ en Safari → 'Agregar a inicio'"
  - Dismissed prompt → no re-show 30 días (localStorage)
- [ ] Offline mode:
  - Client detects `navigator.onLine === false`
  - Banner top: "Sin conexión. Podés ver tu día y crear tareas; se sincronizan al volver."
  - Activities created offline → store en IndexedDB queue
  - On reconnect: replay queue → POST to API
  - If conflict (server has newer): show notice "Algunos cambios se reconciliaron" — user can review
- [ ] Web App badging (Android): show pending check-in count (FT-088 optional enhancement)

## Acceptance Criteria

```gherkin
Scenario: Android install prompt
  Given user en 3rd session on Chrome Android
  When beforeinstallprompt fires
  Then custom banner shown
  When user accepts
  Then PWA installs to home screen

Scenario: iOS install instruction
  Given Safari iOS user
  When trigger conditions met
  Then SCR-056 modal shown con instructional steps
  No actual install (Apple limitation)
  After install, Web Push viable (iOS 16.4+)

Scenario: Offline read
  Given offline mode
  When user navigates to /today
  Then DaySheet renders from cache
  Activity list renders cached version
  Banner shows "Sin conexión"

Scenario: Offline create + sync
  Given offline mode
  When user creates activity via quick-add
  Then queued en IndexedDB
  Optimistic UI shows activity
  When connection returns
  Then queue replays, server creates activity
  If success: queue clears
  If conflict: notice shown

Scenario: Dismissed prompt
  Given user dismissed install prompt
  Then no re-show next 30 days
```

## Definition of Done

- [ ] Lighthouse PWA score ≥90
- [ ] Install works Android Chrome
- [ ] iOS instructions tested manually
- [ ] Offline create + sync tested
- [ ] Service worker registers correctly
- [ ] E2E-014 passing
