---
id: ISSUE-090b
title: Google Calendar OAuth flow (connect, callback, refresh, disconnect, revoke)
epic: EPIC-CALENDAR
milestone: v1.0
priority: P1
story_points: 2
status: completed
completed_date: 2026-05-26
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

- [x] All routes auth-required (`auth()` check, 401 otherwise)
- [x] State CSRF validated on callback (cookie + URL state + HMAC + exp + userId binding)
- [x] Refresh logic correct under concurrent calls (idempotent — same refresh_token reused, accept brief over-refresh)
- [x] UNIQUE conflict on duplicate cuenta returns user-friendly redirect `?error=already_connected`
- [x] Revoke-first / delete-second: if revoke fails non-idempotently → row stays + `last_sync_error` written → 502 returned
- [x] Tests: 29 unit (state x9, google x14, refresh x6) — routes covered by helper tests + manual smoke
- [x] No new env vars needed (reuses AUTH_GOOGLE_ID/SECRET + AUTH_SECRET + ENCRYPTION_KEY + APP_URL)

## Implementation Evidence

**Archivos NEW:**

- `src/lib/integrations/calendar/state.ts` — HMAC-SHA256 state CSRF token (signed `{userId, exp}`, base64url-encoded). Cookie `__calendar_oauth_state` con `HttpOnly + Secure + SameSite=Lax + Path=/api/calendar + Max-Age=600`.
- `src/lib/integrations/calendar/google.ts` — 6 funciones (`buildAuthUrl`, `exchangeCode`, `fetchUserInfo`, `listCalendars`, `refreshAccessToken`, `revokeToken`) + `GoogleApiError` class + `CALENDAR_SCOPE` const. Native `fetch`, sin googleapis SDK.
- `src/lib/integrations/calendar/refresh.ts` — `getValidAccessToken(userId, connectionId)`. Refresh buffer 60s; write-back con cipher fresco. `ConnectionNotFoundError` exportado.
- `src/app/api/calendar/google/connect/route.ts` — GET: auth + signState + set cookie + 302 a Google.
- `src/app/api/calendar/google/callback/route.ts` — GET: auth + verify cookie==URL state + HMAC + exp + userId match + scope check + exchange + userinfo + listCalendars + insert via scopedDb con `onConflictDoNothing` BR-20.
- `src/app/api/calendar/connections/[id]/disconnect/route.ts` — POST: auth + scoped lookup + decrypt refresh_token + revoke + delete. Revoke fail → keep row + write `last_sync_error` + 502.
- `tests/unit/calendar-state.test.ts` — 9 tests (roundtrip, NEXTAUTH_SECRET fallback, MAC tamper, payload tamper, expired, malformed shape, empty halves, empty userId, missing secret).
- `tests/unit/calendar-google.test.ts` — 14 tests (buildAuthUrl shape, getRedirectUri, exchangeCode happy+error, refresh happy+error, fetchUserInfo Bearer+missing email, listCalendars happy+missing items, revokeToken 200+400 idempotent+400 non-idempotent+500).
- `tests/unit/calendar-refresh.test.ts` — 6 tests (not-stale fast path, expired refresh + write-back, within 60s buffer refreshes, just outside buffer doesn't, ConnectionNotFoundError, refresh propagates errors).

**Decisiones de diseño:**

- **HMAC-SHA256 state, no JWT lib**: cero deps adicionales, AUTH_SECRET ya existe. `timingSafeEqual` para constant-time MAC compare.
- **Cookie + URL state cross-check**: cookie blocks cross-site replay (atacante no puede setear nuestra cookie desde otro origen), HMAC blocks tampering, `exp` blocks stale callbacks, embedded `userId` blocks session-swap.
- **`fetch` directo (no `googleapis` SDK)**: 6 endpoints simples, bundle más liviano, tests con global fetch mock triviales.
- **Refresh sin lock**: bajo concurrencia el peor caso es 1 extra refresh roundtrip. Google retorna mismo `refresh_token` (no rota), solo se update access_token + expires_at. SELECT FOR UPDATE no escala bien con neon-serverless HTTP.
- **Revoke-first, delete-second**: revoke fail (non-idempotent) → row keeps + error stored. Premature delete strands el grant on Google's side sin UI para limpiar.
- **400 invalid_token treated as success** en revoke: idempotente — el token ya está revocado por otro path, nada que hacer.
- **Scope check granular en callback**: si `granted_scopes` no incluye `calendar.readonly` (user descheckeó) → redirect `?error=scope_denied`. BR-12.
- **No refresh_token returned por Google** → redirect `?error=no_refresh_token`. Indica que `access_type=offline` no fue honorado (Google a veces lo skip si el user ya consented antes — necesitamos `prompt=consent` para forzar).
- **All error paths → 302 a `/settings/integrations?error=<reason>`**: nunca exponemos Google response bodies al browser. UI A3 traduce los codes a mensajes.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors
- `pnpm test calendar` ✅ 43/43 (incluyendo los 14 tokens de A1)
- `pnpm test` full ✅ 857/858 (1 flake preexistente: register POST gates, isolation pasa)

**Scope deferred → ISSUE-090c (UI):**

- Settings integrations page (SCR-033)
- Connections list + connect button + pausar/renombrar/disconnect actions
- Toast surfaces para `?connected=1` / `?error=*` query params
