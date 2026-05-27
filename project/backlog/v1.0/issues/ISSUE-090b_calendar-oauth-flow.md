---
id: ISSUE-090b
title: Google Calendar OAuth flow (connect, callback, refresh, disconnect, revoke)
epic: EPIC-CALENDAR
milestone: v1.0
priority: P1
story_points: 2
status: ready
dependencies: [ISSUE-090]
user_stories: [US-090, US-090b]
features: [FT-090]
screens: []
business_rules: [BR-12, BR-20]
risks: [R-T-002]
agents: [backend-specialist, security-auditor]
skills: [/backend, /security]
---

# ISSUE-090b — Google Calendar OAuth flow

## Overview

Continuation of ISSUE-090. Slice A1 shipped the schema + AES-256-GCM token crypto + 14 tests. This issue ships the full OAuth lifecycle: connect (redirect to Google) → callback (exchange code, persist encrypted row, list calendars) → refresh (per-connection) → disconnect (revoke + delete row).

## Tasks

- [ ] **Google API client** en `src/lib/integrations/calendar/google.ts`:
  - `buildAuthUrl({ state, accountHint? })` — builds the OAuth URL with scope `https://www.googleapis.com/auth/calendar.readonly` + `openid email` + `prompt=select_account` + `access_type=offline` (force refresh_token issuance) + `state` CSRF token.
  - `exchangeCode(code): Promise<{ access_token, refresh_token, expires_in }>` — POST to `oauth2.googleapis.com/token`.
  - `fetchUserInfo(accessToken): Promise<{ email, name? }>` — GET `https://www.googleapis.com/oauth2/v2/userinfo`.
  - `listCalendars(accessToken): Promise<{ id, primary?, summary }[]>` — GET `calendarList`.
  - `refreshAccessToken(refreshToken): Promise<{ access_token, expires_in }>` — POST `token` endpoint with `grant_type=refresh_token`.
  - `revokeToken(token): Promise<void>` — POST `https://oauth2.googleapis.com/revoke`.
- [ ] **OAuth routes:**
  - `GET /api/calendar/google/connect` — auth-required, generates `state` (signed JWT with userId + expiry 10 min), stores in httpOnly cookie, 302 to `buildAuthUrl`.
  - `GET /api/calendar/google/callback?code=...&state=...` — auth-required, validates `state` cookie matches + not-expired, calls `exchangeCode` + `fetchUserInfo` + `listCalendars`, upserts `calendar_connections` row with encrypted tokens + `external_account_id = email` + `calendar_ids = [primary.id]` + `account_label = email`. On UNIQUE conflict (BR-20) → redirect a `/settings/integrations?error=already_connected`.
  - `POST /api/calendar/connections/[id]/disconnect` — auth-required, validates `id` belongs to caller, calls `revokeToken(refresh_token)`, deletes row. Idempotent.
- [ ] **Refresh helper** en `src/lib/integrations/calendar/refresh.ts`:
  - `getValidAccessToken(connectionId): Promise<string>` — reads connection, if `expires_at` past or within 60s buffer → `refreshAccessToken` + update row with new cipher + `expires_at` + return plaintext. Else return decrypted current token.
  - Idempotent under concurrent calls (use SELECT FOR UPDATE or accept brief over-refresh).
- [ ] **Tests:**
  - Unit: `google.ts` con `fetch` mock (all 6 methods) — URL building, header injection, error parsing.
  - Unit: `refresh.ts` con DB + fetch mocks — happy path (not expired), refresh path, write-back race.
  - Integration test for callback con mocked Google responses: insert row, UNIQUE conflict, partial failure rollback.
  - Rate limit / state validation on `/connect` + `/callback`.

## Acceptance Criteria

```gherkin
Scenario: Conectar primera cuenta Google
  Given user signed in, sin conexiones
  When GET /api/calendar/google/connect
  Then 302 redirect a Google OAuth con scope calendar.readonly
  Tras consent, GET /api/calendar/google/callback?code=...&state=...
  Then row encriptado persisted con provider='google', external_account_id=email
  And redirect a /settings/integrations?connected=1

Scenario: Conectar segunda cuenta multi-cuenta
  Given user ya tiene 1 conexión activa
  When /connect emite URL con prompt=select_account
  Tras consent con cuenta distinta, segundo row creado

Scenario: Re-conectar misma cuenta rechazado (BR-20)
  Given user tiene conexión con external_account_id = 'foo@gmail.com'
  When intenta conectar la misma cuenta
  Then UNIQUE violation cazado → redirect con error=already_connected (no leak de cipher)

Scenario: Refresh expired token
  Given access_token de conexión X expired
  When getValidAccessToken(X) called
  Then refresh_token usado → POST a token endpoint → DB updated con nuevo cipher + expires_at
  And returns plaintext del nuevo access_token

Scenario: Disconnect
  Given user tiene 2 conexiones
  When POST /api/calendar/connections/1/disconnect
  Then revoke API llamado con refresh_token de 1
  And row 1 borrado
  And conexión 2 intacta

Scenario: State CSRF protection
  Given attacker construye callback URL con state arbitrario
  When GET /callback con state que no matchea cookie
  Then 400 invalid_state, no DB write
```

## Definition of Done

- [ ] All routes auth-required (return 401 to unauthed callers)
- [ ] State CSRF validated on callback
- [ ] Refresh logic survives concurrent calls (no double-refresh corruption)
- [ ] UNIQUE conflict on duplicate cuenta returns user-friendly error
- [ ] Revoke + delete atomic (revoke succeeds OR row stays + error logged)
- [ ] Tests cover happy + sad paths (>= 20 tests across google.ts + refresh.ts + routes)
- [ ] `.env.example` actualizado si nuevos vars necesarios
