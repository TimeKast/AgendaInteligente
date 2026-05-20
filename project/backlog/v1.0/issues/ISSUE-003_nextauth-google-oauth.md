---
id: ISSUE-003
title: NextAuth v5 setup + Google OAuth provider
epic: EPIC-AUTH
milestone: v1.0
priority: P0
story_points: 3
status: ready
dependencies: [ISSUE-001, ISSUE-002]
user_stories: [US-001, US-003]
features: [FT-001]
screens: [SCR-002, SCR-003]
business_rules: [OPS-9]
agents: [backend-specialist, security-auditor]
skills: [/backend, /security]
---

# ISSUE-003 — NextAuth v5 + Google OAuth

## Overview

Configurar NextAuth v5 con Drizzle adapter y Google OAuth provider. Setup sign in / sign out flows. Habilitar account linking (Google → existing email user).

## Tasks

- [ ] Configure [src/lib/auth/config.ts](../../../../src/lib/auth/config.ts) con NextAuth v5
- [ ] Drizzle adapter pointing to `users` / `accounts` / `sessions` / `verification_tokens`
- [ ] Google OAuth provider con scopes: `openid email profile`
- [ ] Account linking enabled: `allowDangerousEmailAccountLinking: true` (justified by Brief §2)
- [ ] Callback `signIn`: set `google_oauth_id`, populate `name` y `image` desde Google
- [ ] Callback `session`: include `user.id` en session
- [ ] Auth pages: signin (SCR-003) + error
- [ ] Sign in button component CMP-101 (Google button con SVG correcto)
- [ ] Helper `getCurrentUser()` y `requireAuth()` en [src/lib/auth/helpers.ts](../../../../src/lib/auth/helpers.ts)
- [ ] Middleware protect `/(protected)` routes

## Acceptance Criteria

```gherkin
Scenario: Signup new user via Google
  Given a new email "alice@example.com" not in users
  When alice clicks "Continuar con Google" and grants consent
  Then a user row is created with email + name + image + google_oauth_id
  And alice lands on /onboarding/language

Scenario: Login existing user via Google
  Given alice's user exists
  When alice clicks "Continuar con Google" and consents
  Then session is created and alice lands on /today (if onboarding completed)

Scenario: Account linking
  Given alice has email/password account "alice@example.com"
  When she does Google OAuth with same email
  Then existing user is linked (no duplicate row)
  And subsequent Google sign-in works seamlessly

Scenario: Protected route guard
  Given unauthenticated user
  When they visit /today
  Then redirected to /login
```

## Definition of Done

- [ ] Google OAuth flow end-to-end working en dev (use Google Cloud OAuth client test mode)
- [ ] Integration test for callback handler
- [ ] Tests for `getCurrentUser` / `requireAuth`
- [ ] Middleware tested with multiple protected routes
- [ ] No secrets logged

## Technical Notes

- Apply for OAuth verification temprano (sprint 1) per R-T-002. Scope `email profile` no requiere sensitive verification.
- Account linking: documenta security caveat (same email = same person assumption) en `runbooks/R-002`
- Use NextAuth's `EdgeRuntimeRouteHandler` para middleware compatibility
