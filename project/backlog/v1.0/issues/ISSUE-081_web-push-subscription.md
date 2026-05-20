---
id: ISSUE-081
title: Web Push subscription endpoint + service worker integration
epic: EPIC-CHECKINS
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-001, ISSUE-006]
user_stories: [US-080]
features: [FT-088, FT-089]
screens: []
business_rules: []
risks: [R-T-009]
agents: [backend-specialist, frontend-specialist]
skills: [/backend, /frontend]
---

# ISSUE-081 — Web Push subscription

## Overview

Setup Web Push API: service worker handles incoming pushes, client subscribes during onboarding step 3 (or first visit if granted later), backend stores subscription endpoints + VAPID keys + sends pushes via `web-push` library.

## Tasks

- [ ] VAPID keys: generate + add to env (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`)
- [ ] Service worker (extend TimeKast existing SW):
  - Listen to `push` event
  - Show notification con title, body, icon, click_action URL
  - On notification click → focus or open `click_action` URL (deep link)
- [ ] Migration: add `push_subscriptions` table:
  - user_id, endpoint, p256dh_key, auth_key, ua (user agent for debug), created_at
- [ ] Route Handler `POST /api/push/subscribe`: store subscription
- [ ] Route Handler `POST /api/push/unsubscribe`: delete subscription
- [ ] Helper `sendPushNotification(userId, payload)`:
  - Lookup all subscriptions for user
  - Send to each con `web-push` library
  - Remove subscription if 410 (gone) — endpoint invalid
- [ ] iOS handling: detect Safari + show "Install to home screen for push" prompt (R-T-009)

## Acceptance Criteria

```gherkin
Scenario: Subscribe successfully
  Given user grants push permission durante onboarding
  When client subscribes
  Then POST /api/push/subscribe stores subscription
  Test push delivered successfully

Scenario: Send notification
  Given user has subscription
  When sendPushNotification(userId, { title: "Buenos días", body: "..." }) called
  Then notification delivered via Web Push
  Tap → opens app at click_action URL

Scenario: iOS limit detected
  Given Safari iOS < 16.4
  Then Push API unavailable
  UI shows: "Push notifications no disponible en este browser. Activá email fallback en Settings."

Scenario: Invalid subscription cleanup
  Given user removed PWA from device
  When sendPushNotification attempts
  Then 410 received from push service
  Subscription row deleted from DB
```

## Definition of Done

- [ ] Web Push end-to-end working en Chrome desktop + Chrome Android + Safari iOS 16.4+ (instalado)
- [ ] iOS messaging clear cuando NOT supported
- [ ] Migration applied
- [ ] Helper tested
- [ ] Email fallback documented (uses Resend, NotificationPref.email_enabled)
