---
id: EPIC-AUTH
title: Auth + Multi-tenant + Onboarding
milestone: v1.0
priority: P0
status: ready
story_points: 22
issues: [ISSUE-001, ISSUE-002, ISSUE-003, ISSUE-004, ISSUE-005, ISSUE-006]
features: [FT-001, FT-002, FT-003, FT-004]
user_stories: [US-001, US-002, US-003, US-004, US-005]
business_rules: [BR-1, OPS-9]
screens: [SCR-002, SCR-003, SCR-004, SCR-005, SCR-010..017]
---

# EPIC-AUTH — Auth + Multi-tenant + Onboarding

## Goal

Usuario puede crear cuenta (Google OAuth o email/password), completar onboarding de 8 pasos, y entrar al producto con tenant data isolation absoluta desde día 1.

## Why this matters

BR-1 (multi-tenant data isolation) es **CRITICAL** — leak entre users es producto muerto. Onboarding determina retention (alto drop-off industry standard). Auth providers correctos = primera impresión.

## Out of scope (este epic)

- Magic link auth (descartado v1)
- Apple OAuth (v2)
- GitHub OAuth (v2)
- Account deletion flow (cubierto en EPIC-PWA-SETTINGS)

## Acceptance criteria del epic

- User puede signup con Google OAuth y aterrizar en `/today` después de onboarding
- User puede signup con email/password con verification email
- Multi-tenant isolation enforced via `scopedDb()` helper + ESLint rule + tests
- Onboarding crea User + NotificationPref + Inbox Category + Inbox Project + Subscription free
- E2E-001 + E2E-002 passing

## Dependencies

Ninguna — primer epic. Bloquea el resto del backlog.

## Issues

| ID        | Title                                                                                       | SP  | Priority | Status |
| --------- | ------------------------------------------------------------------------------------------- | --- | -------- | ------ |
| ISSUE-001 | Setup project deps + env config + Vercel deploy                                             | 3   | P0       | 📅     |
| ISSUE-002 | Drizzle schema + migrations (users, accounts, sessions, plans, subscriptions, usage_meters) | 5   | P0       | 📅     |
| ISSUE-003 | NextAuth v5 setup + Google OAuth provider                                                   | 3   | P0       | 📅     |
| ISSUE-004 | Email + password signup/login + bcrypt + Resend verification                                | 5   | P0       | 📅     |
| ISSUE-005 | Multi-tenant `scopedDb` helper + ESLint custom rule + multi-tenant tests                    | 3   | P0       | 📅     |
| ISSUE-006 | Onboarding 8-step flow + auto-create Inbox + first conversation context                     | 3   | P0       | 📅     |
