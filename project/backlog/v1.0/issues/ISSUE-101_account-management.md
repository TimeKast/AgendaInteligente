---
id: ISSUE-101
title: Account management — change email, change password, view profile (SCR-035)
epic: EPIC-PWA-SETTINGS
milestone: v1.0
priority: P1
story_points: 3
status: ready
dependencies: [ISSUE-004, ISSUE-006]
user_stories: [US-122]
features: [FT-122]
screens: [SCR-035]
business_rules: [OPS-9]
agents: [backend-specialist, frontend-specialist, security-auditor]
skills: [/backend, /frontend, /security]
---

# ISSUE-101 — Account management

## Overview

SCR-035 Settings · Account. View profile (email, name, avatar). Change email (con verification). Change password (con current-password challenge). Sign out.

## Tasks

- [ ] Profile section (read-only):
  - Avatar (or initials fallback)
  - Email
  - Name
  - Account type: Google OAuth / Email+password / Both linked
  - Created date
- [ ] Change email flow:
  - Form: new email + current password (si NO Google OAuth user)
  - Server Action `requestEmailChange(newEmail, currentPassword?)`:
    - Validate current password si applicable
    - Generate verification token, save with expiry 24h
    - Send confirmation email to NEW email
    - Show "Te enviamos email de confirmación al nuevo correo"
  - Endpoint `GET /api/account/confirm-email-change?token=`: validates token, updates email, sends notice to OLD email
- [ ] Change password flow (only for email+password users):
  - Form: current password + new password + confirm
  - Validate current password (bcrypt compare)
  - Validate new password strength (not en top 1000)
  - Hash + update
  - Toast "Contraseña actualizada"
- [ ] Sign out button → NextAuth signOut() → redirect /login
- [ ] Rate limit changes: max 3 email change attempts per day per user (OPS-9 extension)
- [ ] Telemetry: log email change events (anonymized)

## Acceptance Criteria

```gherkin
Scenario: View profile
  Given user en /settings/account
  Then sees email, name, avatar, account type

Scenario: Change email — email+password user
  Given alice has email+password account
  When she submits new email + current password
  Then validation: current password correct
  Confirmation email sent to new email
  Status banner: "Esperando confirmación"

Scenario: Confirm email change
  Given alice clicks confirmation link
  Then User.email updated
  Notice email sent to OLD email: "Tu email cambió a [new]"

Scenario: Change password
  Given alice submits current + new password
  When current valid + new strong
  Then password_hash updated
  Toast "Contraseña actualizada"
  Other sessions invalidated (NextAuth)

Scenario: Google OAuth-only user
  Given user signed up con Google, no password
  Then change password section hidden
  Change email may require manual flow / contact support
```

## Definition of Done

- [ ] All 3 forms tested
- [ ] Email change roundtrip works
- [ ] Password change invalidates other sessions
- [ ] Rate limits enforced
- [ ] No password ever logged
