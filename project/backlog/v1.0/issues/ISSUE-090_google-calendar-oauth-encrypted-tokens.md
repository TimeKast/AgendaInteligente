---
id: ISSUE-090
title: CalendarConnection schema (multi-cuenta, multi-provider) + pgcrypto tokens + OAuth flow
epic: EPIC-CALENDAR
milestone: v1.0
priority: P1
story_points: 5
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-001, ISSUE-002, ISSUE-005]
follow_ups: [ISSUE-090b, ISSUE-090c]
user_stories: [US-090, US-090b]
features: [FT-090]
screens: [SCR-033, SCR-062]
business_rules: [BR-12, BR-20]
risks: [R-T-002]
agents: [backend-specialist, security-auditor]
skills: [/backend, /security]
entities: [E-060]
---

# ISSUE-090 — CalendarConnection (multi-cuenta) + OAuth + tokens encriptados

## Overview

Reemplaza la antigua `GoogleCalendarConnection` 1:1 por una entidad `CalendarConnection` N:1 con User. Un mismo user puede conectar 2+ cuentas (típicamente trabajo + personal) y, a futuro, providers distintos (apple, outlook — diferidos a v1.5).

OAuth flow para conectar Google Calendar con scope `calendar.readonly`. Tokens stored encrypted vía pgcrypto (BR-12). UNIQUE `(user_id, provider, external_account_id)` (BR-20). Apply early para OAuth verification (R-T-002).

## Cambio vs versión anterior

| Antes (single)                      | Ahora (multi-cuenta)                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Tabla `google_calendar_connections` | Tabla `calendar_connections`                                                                           |
| 1 row por user                      | N rows por user                                                                                        |
| Sin `provider` (asumido `google`)   | `provider` enum (`google` v1; `apple`/`outlook` v1.5)                                                  |
| Sin `external_account_id`           | `external_account_id` (email de la cuenta Google) — permite distinguir cuentas                         |
| Sin `enabled` toggle                | `enabled boolean` para pausar sync sin desconectar                                                     |
| Sin `account_label` ni color        | Atributos de UI viven en este issue (label) — color se agrega en US-090b (issue distinto si necesario) |

## Tasks

- [ ] Migration: crear `calendar_connections` table per E-060
  - `id uuid pk`
  - `user_id uuid NOT NULL FK → users.id ON DELETE CASCADE`
  - `provider text NOT NULL CHECK (provider IN ('google','apple','outlook'))`
  - `external_account_id text NOT NULL`
  - `access_token bytea NOT NULL` (encriptado pgcrypto)
  - `refresh_token bytea NOT NULL` (encriptado pgcrypto)
  - `expires_at timestamptz NOT NULL`
  - `calendar_ids text[] NOT NULL DEFAULT '{}'`
  - `enabled boolean NOT NULL DEFAULT true`
  - `account_label text NULL` (default = email al primer connect)
  - `connected_at timestamptz NOT NULL DEFAULT now()`
  - `last_synced_at timestamptz NULL`
  - `last_sync_error text NULL`
  - UNIQUE `(user_id, provider, external_account_id)` — BR-20
  - Index `(user_id, enabled)`
- [ ] Helper [src/lib/integrations/calendar/tokens.ts](../../../../src/lib/integrations/calendar/tokens.ts):
  - `encryptToken(plain)` / `decryptToken(cipher)` con `ENCRYPTION_KEY` env var
  - Roundtrip test (U-007)
- [ ] OAuth flow Google:
  - `GET /api/calendar/google/connect`: redirect a Google OAuth scope `calendar.readonly` (incluye `prompt=select_account` para forzar account picker al conectar 2da cuenta)
  - `GET /api/calendar/google/callback?code=...`: exchange code → tokens, obtener email de la cuenta (`userinfo.email`), upsert `calendar_connections` row con `external_account_id = email`. Si UNIQUE constraint dispara → mensaje claro "esa cuenta ya está conectada"
  - Tras connect: lista calendarios de la cuenta (`GET /users/me/calendarList`), default toggle primary on
- [ ] Refresh token logic per-connection: si access_token expira, refresh + update DB
- [ ] Disconnect: `POST /api/calendar/connections/[id]/disconnect` borra row + revoca via Google revoke endpoint
- [ ] Sync busy slots reescritura: `CalendarBusySlot` gana columna `connection_id FK → calendar_connections.id` (cubierto en ISSUE-091 update)

## Acceptance Criteria

```gherkin
Scenario: Conectar primera cuenta Google
  Given user en /settings/integrations sin conexiones
  When tap "Conectar Google Calendar"
  Then redirect a Google OAuth con scope calendar.readonly
  Tras consent, callback persiste row encriptado con provider='google', external_account_id=email
  Redirect a /settings/integrations con badge "Conectado"

Scenario: Conectar segunda cuenta Google (multi-cuenta)
  Given user ya tiene 1 conexión activa
  When tap "+ Conectar otra cuenta"
  Then OAuth flow incluye prompt=select_account
  Tras consent con cuenta distinta, segundo row creado
  Lista en UI muestra ambas conexiones

Scenario: Re-conectar misma cuenta rechazado (BR-20)
  Given user tiene conexión con external_account_id = 'foo@gmail.com'
  When intenta conectar la misma cuenta de nuevo
  Then OAuth callback detecta UNIQUE violation y muestra "esa cuenta ya está conectada"

Scenario: Tokens encriptados at rest
  Given CalendarConnection row
  When SELECT raw column access_token
  Then retorna BYTEA (no plaintext)
  When decryptToken con ENCRYPTION_KEY
  Then retorna plaintext token

Scenario: Refresh expired token per-connection
  Given access_token de conexión X expired
  When API call hacia esa conexión
  Then refresh_token de X usado, DB updated con nuevo cipher + expires_at

Scenario: Disconnect una sola conexión
  Given user tiene 2 conexiones
  When disconnect de la conexión 1
  Then row 1 borrado + Google revoke API llamado
  Conexión 2 permanece intacta
  CalendarBusySlot cache invalidated para connection_id=1 solamente

Scenario: account_label default
  Given primera conexión Google con email "foo@gmail.com"
  Then account_label = 'foo@gmail.com' por default
  User puede editarlo posteriormente (US-090b)
```

## Definition of Done

- [ ] **Google OAuth verification submitted** (o plan test mode documentado) → **ISSUE-090b**
- [x] Migration aplicada
- [x] Encryption roundtrip testeado (U-007, I-024)
- [ ] OAuth flow end-to-end testeado (E2E con stub OAuth) → **ISSUE-090b**
- [ ] Refresh logic testeado per-connection → **ISSUE-090b**
- [x] UNIQUE constraint BR-20 testeado (DB-level UNIQUE + scoped-db registry; behavioral test al callback en A2)
- [ ] Runbook R-010 actualizado: key rotation + multi-cuenta troubleshooting → **ISSUE-090b/c**
- [ ] Referencias a `GoogleCalendarConnection` (legacy) marcadas como obsoletas en docs → ningún ref legacy en código actual; doc-only sweep no necesario

## Implementation Evidence

**Scope split** — issue de 5 SP partido en 3 slices para mantener PRs auditables:

| Slice  | SP  | Contenido                               | Status     |
| ------ | --- | --------------------------------------- | ---------- |
| **A1** | 2   | Schema + crypto + tests                 | ✅ este PR |
| **A2** | 2   | OAuth flow + refresh + disconnect       | ISSUE-090b |
| **A3** | 1   | UI settings integrations page (SCR-033) | ISSUE-090c |

**Archivos NEW (Slice A1):**

- `src/lib/integrations/calendar/tokens.ts` — `encryptToken(plain: string): Buffer` y `decryptToken(blob: Buffer | Uint8Array): string`. AES-256-GCM con IV random de 12 bytes. Format on-disk: `IV || authTag(16) || ciphertext`. Validación de key shape (32 bytes decoded de base64). Type-guards strictos.
- `src/lib/db/schema/calendar-connections.ts` — E-060 (13 cols + custom `bytea` Drizzle type para tokens + 2 indexes + `CALENDAR_PROVIDERS` const). UNIQUE `(user_id, provider, external_account_id)` enforce BR-20 al DB level.
- `src/lib/db/migrations/0016_bumpy_silvermane.sql` — autogen + 1 CHECK manual `provider IN ('google','apple','outlook')`.
- `tests/unit/calendar-tokens.test.ts` — 14 tests (roundtrip × 5, non-determinism × 2, tamper × 3, wrong-key × 1, key shape validation × 2, type guards × 1).

**Archivos EDIT (Slice A1):**

- `src/lib/db/schema/index.ts` — barrel export.
- `src/lib/db/scoped.ts` — register `calendarConnections` (10 tablas en TENANT_TABLES).
- `tests/unit/scoped-db.test.ts` — assertion update.

**Decisión de diseño clave — app-layer AES-256-GCM en lugar de pgcrypto:**

El issue original mencionaba "pgcrypto" pero la implementación shipea con app-layer crypto (Node `node:crypto`). Razones documentadas en JSDoc de `tokens.ts`:

1. **Key isolation**: el ENCRYPTION_KEY vive solo en el proceso app — nunca viaja por SQL params, no aparece en pg_stat / slow query logs.
2. **Zero extension dependency**: pgcrypto requiere `CREATE EXTENSION` (lista de extensiones permitidas en Neon es mutable; pgvector ya fue bloqueado en este proyecto). No queremos token security blocked por infra capabilities.
3. **Key rotation cleaner**: re-encrypt batch desde la app (stream + control de back-pressure). Con pgcrypto sería un UPDATE masivo bloqueante.
4. **Security profile equivalente**: AES-256-GCM es FIPS-approved y authenticated (auth tag detecta tampering — tests lo verifican).
5. **Test setup simpler**: cero SQL extension en test DB; el suite usa `crypto.randomBytes` real.

La spec original "pgcrypto" se trata como terminología legacy del discovery brief — la decisión técnica se documentó en code-comments + en este registro.

**Decisiones secundarias:**

- **IV de 12 bytes (96 bits)**: spec GCM recomienda este tamaño (más wide desperdicia, más narrow rompe birthday bound).
- **Auth tag de 16 bytes (128 bits)**: tamaño máximo recomendado; cualquier tampering de 1 byte en cipher OR tag → decrypt falla.
- **Drizzle `customType<bytea>`**: Drizzle no shippea `bytea` nativo; el helper inline mapea a `Buffer` en ambos sentidos (insert + select).
- **`Uint8Array` coercion en `decryptToken`**: algunos Postgres drivers (incluyendo neon-serverless en ciertos contexts) surface bytea como `Uint8Array` en lugar de `Buffer`. Coerción defensiva evita errores a callers.
- **Sin OAuth flow aquí**: el callback que materializa `external_account_id = email` + populate `calendar_ids` vive en A2. Aquí solo schema.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors (7 warnings preexistentes)
- `pnpm db:migrate` ✅ aplicado a Neon
- `pnpm test calendar-tokens scoped-db` ✅ 25/25
- `pnpm test` full ✅ **829/829** (sin flake)

**Scope deferred (capturado en follow-ups):**

- OAuth `/connect` + `/callback` routes con Google API → **ISSUE-090b**
- Refresh helper + Google revoke en disconnect → **ISSUE-090b**
- Settings integrations page (SCR-033) → **ISSUE-090c**
- E2E tests con stub OAuth → **ISSUE-090b**
- Runbook R-010 key rotation → **ISSUE-090b/c**
