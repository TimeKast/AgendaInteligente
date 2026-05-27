---
id: ISSUE-081b
title: iOS Safari push detection + install-to-homescreen hint (R-T-009)
epic: EPIC-CHECKINS
milestone: v1.0
priority: P2
story_points: 1
status: ready
dependencies: [ISSUE-081]
risks: [R-T-009]
agents: [frontend-specialist]
skills: [/frontend]
---

# ISSUE-081b — iOS push hint

## Overview

The kit's push system works on Chrome / Firefox / Safari (PWA installed). Safari iOS < 16.4 lacks Push API entirely; ≥ 16.4 requires the PWA to be installed to home screen. This issue ships the detection + hint UI.

## Tasks

- [ ] Helper `isPushSupported()` — detects `'PushManager' in window` AND not Safari-with-no-installed-PWA.
- [ ] In onboarding step 3 + settings/notifications: if unsupported on iOS, show "Para recibir recordatorios en iPhone, agregá la app a tu pantalla de inicio" with a step-by-step illustration.
- [ ] Fallback CTA: "Activar email recordatorios" toggle.

## Definition of Done

- [ ] iOS Safari < 16.4 + ≥ 16.4 both surface the right message
- [ ] Email fallback toggle wired
- [ ] Component tested with mocked `userAgent` strings
