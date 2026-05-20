---
id: ISSUE-004
title: Email + password signup / login + bcrypt + Resend email verification
epic: EPIC-AUTH
milestone: v1.0
priority: P0
story_points: 5
status: ready
dependencies: [ISSUE-002, ISSUE-003]
user_stories: [US-002, US-003]
features: [FT-002]
screens: [SCR-002, SCR-003, SCR-004, SCR-005]
business_rules: [OPS-9]
agents: [backend-specialist, security-auditor]
skills: [/backend, /security]
---

# ISSUE-004 — Email + password auth + verification

## Overview

Add credentials provider (email + password) to NextAuth. Hash con bcrypt. Send verification email vía Resend. Add password reset flow.

## Tasks

- [ ] Credentials provider en NextAuth config con `authorize()` validando email + bcrypt compare
- [ ] Signup Server Action `/lib/actions/auth.ts`:
  - Validate email + password (Zod) con regla "password no en top 1000 weak"
  - bcrypt hash rounds=12
  - Insert user con `email_verified_at = null`
  - Send verification email via Resend con magic link `/api/auth/verify?token=...`
  - Return success or specific error
- [ ] Verify email endpoint: validate token, set `email_verified_at = now`
- [ ] Banner CMP-031 "Verifica tu email" en Today para users sin verify
- [ ] Password reset flow:
  - Form en SCR-004 (request)
  - Endpoint genera token + envía email
  - Form en SCR-005 (confirm con token) updates password
- [ ] Tests:
  - Signup OK + verification email enviado
  - Duplicate email rejected
  - Weak password rejected
  - Login con email no verificado OK pero shows banner
  - Password reset roundtrip

## Acceptance Criteria

```gherkin
Scenario: Signup with email/password
  Given no user with "alice@example.com"
  When she submits signup form with valid email + strong password
  Then user row created with password_hash (bcrypt) and email_verified_at=null
  And verification email sent via Resend
  And alice is auto-logged in and lands on /onboarding/language

Scenario: Email verification
  Given alice received verification email
  When she clicks the link
  Then email_verified_at is set to now
  And banner "Verifica tu email" no longer shows

Scenario: Weak password rejected
  Given alice tries signup with password "12345678"
  When form submitted
  Then error shows: "Elegí una contraseña más fuerte"
  And no user row created

Scenario: Password reset
  Given alice has account
  When she requests reset and clicks email link
  Then she can set new password
  And old password no longer works
```

## Definition of Done

- [ ] Bcrypt rounds = 12 confirmed
- [ ] Resend integration working en dev (verify email arrives)
- [ ] Top 1000 weak password list integrated
- [ ] Rate limit on signup endpoint: 3/hour per IP (OPS-9)
- [ ] Rate limit on login: 5/15min per IP, 20/15min per email
- [ ] No password ever logged
- [ ] E2E test: signup → verify → login

## Technical Notes

- TimeKast kit ya tiene Resend setup — extender, no re-implementar
- Email templates: use TimeKast existing templates como base, override copy con voice neutro ("Confirmá tu cuenta" no "¡Welcome aboard! 🎉")
- Magic-link auth NO incluido v1 (per design decision Q10b)
