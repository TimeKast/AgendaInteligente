---
id: EPIC-V2-MOBILE-NATIVE
title: React Native + Expo mobile-native (si métricas justifican)
milestone: v2
priority: P3
status: placeholder
story_points: ~50
issues: []
features: [FT-370]
user_stories: []
business_rules: []
screens: []
---

# EPIC-V2-MOBILE-NATIVE — Native mobile app

## Goal

Build React Native + Expo native app sharing the same Next.js backend. Solo si PWA metrics indicate native is needed:

- iOS install rate < 30% por PWA limitations
- User complaints en feedback about PWA latency / iOS push limitations
- Revenue justifies engineering investment

Backend stays Next.js + Drizzle + Neon — only frontend duplicated.

## When to atomize

After v1 stable + at least 6 meses of PWA metrics. NOT a priori.

## Decision framework (pre-atomize)

Before committing to this epic, evaluate:

| Metric                     | Target                                         |
| -------------------------- | ---------------------------------------------- |
| Monthly Active Users (MAU) | ≥1000 (PWA validates product-market fit first) |
| iOS PWA install rate       | If <30%, native may help                       |
| Push notification delivery | If <80% on iOS, native is justified            |
| Revenue                    | Must support 8-12 weeks dev investment         |

Si métricas NO justifican: skip this epic indefinitely. PWA is fine.

## Issues (TBD)

- Expo project setup
- Shared API client (TypeScript)
- Auth flow native (Google + Apple OAuth — Apple required on iOS for App Store)
- Push notifications native (FCM + APNs direct)
- Voice capture native (better than Web Speech API)
- App Store + Play Store submissions
- Feature parity audit
