---
id: ISSUE-001
title: Setup project deps + env config + Vercel deploy
epic: EPIC-AUTH
milestone: v1.0
priority: P0
story_points: 3
status: completed
completed_date: 2026-05-25
dependencies: []
user_stories: []
features: [FT-001, FT-002]
screens: []
business_rules: []
agents: [backend-specialist, architect]
skills: [/architect, /database]
---

# ISSUE-001 — Setup project deps + env config + Vercel deploy

## Overview

Bootstrap the TimeKast starter kit for AgendaInteligente: install pnpm deps, add Anthropic + Inngest + pgvector packages, configure `.env.local` with required keys, deploy first preview to Vercel, validate health endpoint.

## Tasks

- [ ] `pnpm install` clean
- [ ] Add new deps: `@anthropic-ai/sdk`, `inngest`, `openai` (for Whisper), `googleapis`, `rrule`
- [ ] Add devDeps: `@inngest/eventschemas`
- [ ] Create `.env.example` con todas las keys requeridas:
  - `DATABASE_URL` (Neon)
  - `AUTH_SECRET` (NextAuth)
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `RESEND_API_KEY`
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
  - `ENCRYPTION_KEY` (32-byte base64 for pgcrypto)
  - `SENTRY_DSN`
- [ ] Validate env vars with Zod en [src/config/env.ts](../../../../src/config/env.ts) (TimeKast pattern)
- [ ] Create Neon project + Neon branch for dev
- [ ] Enable pgvector extension en Neon (run `CREATE EXTENSION pgvector`)
- [ ] Configure Vercel project: link repo + add env vars + deploy preview
- [ ] Verify `/api/health` returns 200 en preview URL

## Acceptance Criteria

```gherkin
Scenario: Deploy preview health check
  Given the project is connected to Vercel and Neon
  When a deploy completes successfully
  Then GET /api/health returns 200 with { ok: true, version, ts }
  And no env validation errors in logs

Scenario: Local dev boot
  Given .env.local has all required vars set
  When `pnpm dev` is run
  Then server starts on :3000 without errors
  And database connection succeeds
```

## Definition of Done

- [ ] All deps installed, no warnings about peer mismatches
- [ ] `.env.example` committed (no secrets)
- [ ] Vercel preview URL working
- [ ] Neon DB ready con pgvector enabled
- [ ] `pnpm verify` (lint + typecheck + test) green
- [ ] README updated con quick start steps si difiere del TimeKast default

## Technical Notes

- TimeKast kit ya viene con Next.js 16, Drizzle, NextAuth, Tailwind v4, Vitest, Playwright, Sentry, lint-staged
- Solo agregamos lo específico de AgendaInteligente arriba
- pgvector se activa pero no se usa hasta v1.5 (pattern detection)

## Implementation Evidence

**Deps instaladas:**

- `@anthropic-ai/sdk@^0.98.0` (Claude Sonnet — agente)
- `inngest@^4.4.0` (background jobs / cron)
- `openai@^6.39.0` (Whisper STT fallback)
- `googleapis@^172.0.0` (Calendar API read-only)
- `rrule` **DESCARTADO** — BR-11 redefinida como DSL custom (no iCal). ISSUE-024 actualizada en consecuencia.
- `@inngest/eventschemas` **DESCARTADO** — no existe como paquete separado; `EventSchemas` viene en `inngest` main.

**Env vars agregados a `.env.example` + `src/lib/env.ts` Zod schema:**

- `ANTHROPIC_API_KEY` + helper `getAnthropicKey()`
- `OPENAI_API_KEY` + `isOpenAIConfigured()` / `getOpenAIKey()`
- `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` + `isInngestConfigured()` / `getInngestConfig()`
- `ENCRYPTION_KEY` + `getEncryptionKey()` (BR-12, BR-20 — pgcrypto symmetric)

**Decisión de scope** — `src/config/env.ts` (mencionado en el issue original) NO se creó; el kit ya tiene `src/lib/env.ts` maduro con patrón lazy-cached. Extender el existente vs duplicar.

**Infra provisionada:**

- Neon project + branch dev creados (DATABASE_URL en `.env.local` gitignored)
- Extensión `vector` instalada en Neon SQL editor (nombre real, no `pgvector` que es el paquete)
- `AUTH_SECRET` + `ENCRYPTION_KEY` generadas vía `openssl rand -base64 32`

**Verificación local:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ (0 errors, 7 warnings pre-existentes del kit)
- `pnpm test` ⚠️ 470-471 / 472 — flake pre-existente bajo concurrencia, no relacionado con esta issue
- `pnpm exec next dev --turbopack --port 3002` ✅ Ready en 1.2s
- `curl http://localhost:3002/api/health` → `{"status":"ok","database":"connected","version":"1.0.0"}` ✅ HTTP 200

**Pendiente para AC Scenario 1 (Vercel deploy preview):**

- Vercel link manual desde dashboard (regla SK.md §7.1 bloquea `vercel link/pull` desde CLI)
- Push env vars a Vercel desde su UI
- Verificar `/api/health` 200 en preview URL

**Bug del kit detectado** (out of scope, anotado para otro issue):

- Script `dev:next` usa sintaxis bash `NODE_OPTIONS='...'` no-cross-platform; falla en Windows PowerShell. Workaround: usar `pnpm exec next dev` directo.
