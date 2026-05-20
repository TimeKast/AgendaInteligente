---
id: EPIC-PWA-SETTINGS
title: PWA install + Settings hub + Billing infra + Privacy (account delete + data export)
milestone: v1.0
priority: P1
status: ready
story_points: 18
issues: [ISSUE-100, ISSUE-101, ISSUE-102, ISSUE-103, ISSUE-104]
features: [FT-110, FT-111, FT-112, FT-113, FT-120, FT-121, FT-122, FT-123, FT-124]
user_stories: [US-110, US-111, US-120, US-121, US-122, US-123, US-124]
business_rules: [BR-14]
risks: [R-C-001, R-T-009]
screens: [SCR-024, SCR-032, SCR-034, SCR-035, SCR-036, SCR-037, SCR-055, SCR-056, SCR-059]
---

# EPIC-PWA-SETTINGS — PWA + Settings hub + Privacy

## Goal

Complete the user-facing infrastructure: Settings hub + sub-screens (Language/TZ, Appearance/dark, Account, Billing placeholder, Privacy). PWA install prompts con iOS instructions. Account deletion soft-delete + 30-day grace + data export (GDPR-like). Billing placeholder en SCR-036 mostrando UsageMeter.

## Why this matters

Without complete settings, user cannot control la experiencia. Sin account deletion + export, GDPR-equivalent compliance breaks (R-C-001). PWA install es key para iOS push (R-T-009).

## Out of scope (este epic)

- Stripe activation (v2 — EPIC-V2-STRIPE-BILLING)
- Pattern detection settings (v1.5)

## Dependencies

- EPIC-AUTH (User table + scopedDb)
- EPIC-CHECKINS (Notifications settings ya en ISSUE-086)
- EPIC-AI-AGENT (Intensity settings ya en ISSUE-054)
- EPIC-CALENDAR (Integrations settings ya en ISSUE-093)

## Issues

| ID        | Title                                                                          | SP  | Priority |
| --------- | ------------------------------------------------------------------------------ | --- | -------- |
| ISSUE-100 | Settings hub (SCR-024) + Language/TZ + Appearance/dark mode toggle             | 4   | P1       |
| ISSUE-101 | Account management (change email, change password, view profile)               | 3   | P1       |
| ISSUE-102 | PWA install prompts (Android native + iOS instructional) + offline mode básico | 4   | P1       |
| ISSUE-103 | Settings · Billing placeholder + UsageMeter display (plan info sin Stripe)     | 3   | P2       |
| ISSUE-104 | Account deletion + data export ZIP + soft-delete grace banner + purge cron     | 4   | P1       |
