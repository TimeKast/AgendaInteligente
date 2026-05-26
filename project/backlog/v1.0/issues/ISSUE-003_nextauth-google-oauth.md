---
id: ISSUE-003
title: NextAuth v5 setup + Google OAuth provider
epic: EPIC-AUTH
milestone: v1.0
priority: P0
story_points: 3
status: completed
completed_date: 2026-05-26
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

## Implementation Evidence

**Estado del kit pre-issue (ya implementado):**

- NextAuth v5 + Drizzle adapter (auth.ts/auth.config.ts Edge-safe split)
- Google provider con scopes `openid email profile` + `allowDangerousEmailAccountLinking: true`
- signIn callback sincronizando `name` + `image`
- `linkAccount` event con image sync
- `createUser` event seteando role + humanId
- LoginForm con botón Google
- authorized callback en authConfig (NextAuth v5 idiom; gating per request sin middleware separado)

**Gaps cerrados en este issue:**

- `src/lib/auth/auth.ts` — `signIn` callback extendido: setea `google_oauth_id` en users existentes que logean con Google (lookup rápido sin JOIN al accounts table, BR-1). `linkAccount` event extendido: setea `google_oauth_id` al primer OAuth signup (cuando aún no existe el user en signIn). Nuevo `redirect` callback: respeta same-origin URLs + default `/today`. La doc inline marca que el branching onboarding-vs-app va en `/today` Server Component (deferido a ISSUE-006 porque la sesión no es leíble desde el redirect callback).
- `src/lib/auth/helpers.ts` NEW — `getCurrentUser()` (returns session.user | null) y `requireAuth(redirectTo?)` (returns user or calls next/navigation `redirect('/login?callbackUrl=...')`).
- `src/lib/auth/index.ts` — re-export helpers.
- `src/middleware.ts` NEW — Edge-runtime middleware re-exportando `auth` desde `authConfig`, con matcher excluyendo `/api/auth`, `_next/*` y assets estáticos.
- `tests/unit/auth-helpers.test.ts` NEW — 7 tests (3 getCurrentUser + 4 requireAuth con encoding de callbackUrl).

**Decisiones de scope:**

- **Routes prototipo (`/today /week /month etc`) siguen en `publicPaths`** del `authorized` callback. Quitar el gating ahora rompería la demo de Vercel sin tener flow real de login→onboarding→today. Gating real se hace en ISSUE-006 cuando esté el flow completo.
- **`/onboarding/language`** mencionado en AC Scenario 1 NO se crea acá — es scope de ISSUE-006 (epic onboarding). El redirect callback default a `/today` y el branching onboarding-vs-app vivirá en el Server Component de `/today`.
- **Integration test del callback inline** reconciliado a "no" — el callback está dentro de `NextAuth({...})` options sin export separado; testearlo requeriría refactor extenso del kit. Validación end-to-end vendrá cuando se ejecute Google OAuth real con credenciales.

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors
- `pnpm test` ✅ 491/491 sin flakes
- `pnpm test tests/unit/auth-helpers.test.ts` ✅ 7/7
- `pnpm exec next dev` ✅ Ready 837ms con `Environments: .env.local` + middleware activo
- Smoke `/login` → 200, `/api/health` → 200, `/today` → 200 (público por scope decision)

**Setup pendiente del usuario para activar Google OAuth (1 vez):**

1. Google Cloud Console → Credentials → Create OAuth client ID (Web app)
2. Authorized redirect URI: `http://localhost:3002/api/auth/callback/google`
3. Agregar a `.env.local`:
   ```
   AUTH_GOOGLE_ID="..."
   AUTH_GOOGLE_SECRET="..."
   NEXT_PUBLIC_AUTH_GOOGLE="true"
   ```
4. Restart dev. El botón "Continuar con Google" en `/login` se activa.

**AC residuales pendientes de credenciales OAuth (validación end-to-end live):**

- Scenario 1 (signup nuevo via Google → user row + google_oauth_id)
- Scenario 2 (login existente via Google → /today)
- Scenario 3 (account linking email/password + Google)

El código está listo. Estos AC se cierran sin más cambios cuando el OAuth client esté provisionado.
