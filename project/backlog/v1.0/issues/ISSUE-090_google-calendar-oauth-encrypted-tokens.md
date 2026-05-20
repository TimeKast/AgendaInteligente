---
id: ISSUE-090
title: GoogleCalendarConnection schema + pgcrypto encrypted tokens + OAuth flow
epic: EPIC-CALENDAR
milestone: v1.0
priority: P1
story_points: 5
status: ready
dependencies: [ISSUE-001, ISSUE-002, ISSUE-005]
user_stories: [US-090]
features: [FT-090]
screens: [SCR-033]
business_rules: [BR-12]
risks: [R-T-002]
agents: [backend-specialist, security-auditor]
skills: [/backend, /security]
entities: [E-060]
---

# ISSUE-090 — Google Calendar OAuth + encrypted tokens

## Overview

OAuth flow para conectar Google Calendar con scope `calendar.readonly`. Tokens stored encrypted via pgcrypto (BR-12). Apply early for OAuth verification (R-T-002).

## Tasks

- [ ] **Sprint 1 task: Apply para Google OAuth verification** (no espera al implementation week). Scope `calendar.readonly` no es sensitive — fast track esperado.
- [ ] Migration: create `google_calendar_connections` table per E-060
  - access_token BYTEA, refresh_token BYTEA (both encrypted)
  - Use `pgp_sym_encrypt(token, ENCRYPTION_KEY)` en INSERT/UPDATE
- [ ] Helper [src/lib/integrations/google-calendar/tokens.ts](../../../../src/lib/integrations/google-calendar/tokens.ts):
  - `encryptToken(plain)` / `decryptToken(cipher)` con ENCRYPTION_KEY env var
  - Roundtrip test (U-007)
- [ ] OAuth flow:
  - `GET /api/google-calendar/connect`: redirect to Google con scope `https://www.googleapis.com/auth/calendar.readonly`
  - `GET /api/google-calendar/callback?code=...`: exchange code for tokens, store encrypted, redirect to `/settings/integrations`
- [ ] Refresh token logic: si access_token expira, use refresh_token to get new one + update DB
- [ ] Disconnect: `POST /api/google-calendar/disconnect` deletes row + revokes token via Google revoke endpoint

## Acceptance Criteria

```gherkin
Scenario: Connect Google Calendar
  Given user en /settings/integrations
  When she clicks "Conectar Google Calendar"
  Then redirected to Google OAuth con calendar.readonly scope
  After consent, callback stores tokens encrypted
  Redirect to /settings/integrations with "Conectado" status

Scenario: Tokens encrypted at rest
  Given GoogleCalendarConnection row
  When SELECT raw column access_token
  Then returns BYTEA (not plaintext)
  When decryptToken called con ENCRYPTION_KEY
  Then returns plaintext token

Scenario: Refresh expired token
  Given access_token expired
  When API call attempts
  Then refresh_token used to get new access_token
  DB updated con new encrypted access_token + expires_at

Scenario: Disconnect
  Given connection exists
  When user clicks Disconnect
  Then row deleted + Google revoke API called
  CalendarBusySlot cache invalidated
```

## Definition of Done

- [ ] **Google OAuth verification applied for** (or test mode plan documented)
- [ ] Migration applied
- [ ] Encryption roundtrip tested (U-007, I-024)
- [ ] OAuth flow tested end-to-end
- [ ] Refresh logic tested
- [ ] Documentation en runbook R-010 con key rotation procedure
