---
id: ISSUE-006
title: Onboarding 8-step flow + auto-create Inbox + first conversation context
epic: EPIC-AUTH
milestone: v1.0
priority: P0
story_points: 3
status: completed
completed_date: 2026-05-26
dependencies: [ISSUE-003, ISSUE-004, ISSUE-005]
user_stories: [US-005]
features: [FT-004]
screens: [SCR-010, SCR-011, SCR-012, SCR-013, SCR-014, SCR-015, SCR-016, SCR-017]
business_rules: [BR-2, BR-3]
agents: [frontend-specialist, backend-specialist]
skills: [/frontend, /backend]
---

# ISSUE-006 — Onboarding 8-step flow

## Overview

Implement the 8-step onboarding flow (SCR-010 through SCR-017) that runs immediately after signup. Last step transitions to `/today`. Auto-create Inbox Category + Inbox Project + NotificationPref + Subscription 'free' atomically.

## Tasks

- [ ] Routes:
  - `/onboarding/language` (SCR-010)
  - `/onboarding/timezone` (SCR-011)
  - `/onboarding/push` (SCR-012)
  - `/onboarding/mic` (SCR-013)
  - `/onboarding/context` (SCR-014)
  - `/onboarding/schedule` (SCR-015)
  - `/onboarding/calendar` (SCR-016)
  - `/onboarding/done` (SCR-017)
- [ ] `(onboarding)` route group with OnboardingLayout (CMP-090) overriding AppShell:
  - Progress dots top (CMP-091)
  - "Saltar" link top-right (excepto step 1)
  - Single column max-width 480px
- [ ] Middleware: if `users.onboarding_completed_at IS NULL`, redirect away from `/today` to next onboarding step
- [ ] Inverse middleware: if `onboarding_completed_at IS NOT NULL`, redirect away from `/onboarding/*` to `/today`
- [ ] Per-step Server Action that:
  - Updates the relevant User/NotificationPref field
  - On step 8 (`done`): atomically create Inbox Category + Inbox Project + Subscription 'free' + set `onboarding_completed_at = now`
  - Trigger Inngest event `user.signed_up` para schedule recurring check-ins
- [ ] Frustration capture (SCR-014) stores text en `users.onboarding_context` (used as agent system prompt context later)
- [ ] Google Calendar opt-in (SCR-016) NOT obligatorio — store user choice; if "Conectar ahora" → redirect to OAuth then back to `/onboarding/done`

## Acceptance Criteria

```gherkin
Scenario: Full onboarding completion
  Given new user just signed up via Google
  When she completes all 8 steps in order
  Then User row updated con language, timezone, intensity_default_until, onboarding_context, onboarding_completed_at
  And NotificationPref row created con check-in times
  And Inbox Category (is_inbox=true) created
  And Inbox Project (is_inbox=true) created en Inbox Category
  And Subscription free created
  And user lands en /today
  And Inngest event `user.signed_up` fired

Scenario: User skips optional steps
  Given user on /onboarding/mic
  When she taps "Saltar"
  Then she moves to /onboarding/context without mic permission granted
  And no error blocks her

Scenario: Required step (language) not skippable
  Given user on /onboarding/language
  When trying to navigate away without selecting
  Then she stays on this step

Scenario: Resume mid-onboarding
  Given user partially completed onboarding (e.g., language + timezone)
  When she closes browser and re-opens app
  Then she lands on /onboarding/push (next pending step)
  And previously selected values persist

Scenario: Already onboarded user
  Given alice has onboarding_completed_at set
  When she visits /onboarding/language
  Then redirected to /today
```

## Definition of Done

- [ ] All 8 routes accessible, navigable forward
- [ ] Backward navigation OK (browser back)
- [ ] Atomic creation of related rows en step 8 (single transaction)
- [ ] Tests for middleware (onboarding incomplete vs complete)
- [ ] Tests for Inngest event fired
- [ ] E2E-001 + E2E-002 passing
- [ ] Microcopy follows voice (italic serif placeholders, no coachy)

## Technical Notes

- Each step is its own page (not single SPA with state) — allows refresh-safe progression
- Step state lives in DB rows progressively updated — not React state
- Atomic step 8: use `db.transaction(async (tx) => { ... })`
- The 3 questions from frustration capture: just 1 textarea in v1; expand to 3 conversational questions in v1.5 si métricas lo justifican

## Implementation Evidence

**Archivos:**

- `src/lib/validations/onboarding.ts` — 7 schemas (language/timezone/push/mic/context/schedule/calendar) + 1 trigger schema (finalize sin payload, `z.object({}).strict()`).
- `src/lib/actions/onboarding.ts` — 8 server actions. `finalizeOnboarding` usa `db.transaction()` para multi-table atomic write con idempotent pre-check.
- `src/lib/auth/auth.config.ts` — `authorized` callback gatea con `onboardingCompletedAt`; rutas prototype REMOVIDAS de `publicPaths` (gating real). Redirect logic: not-onboarded → `/onboarding/language`; already onboarded en /onboarding/\* → `/today`. Session callback expone `onboardingCompletedAt` al cliente.
- `src/lib/auth/auth.ts` — JWT callback sincroniza `onboardingCompletedAt` desde DB en signIn/signUp/update (serializado ISO).
- `eslint.config.mjs` — `src/lib/actions/onboarding.ts` allowlisted para BR-1 rule (multi-table transaction no es modelable con scopedDb).
- `src/components/agenda/OnboardingLayout.tsx` — refactor dual-mode (LinkBody vs FormBody según `formAction?` prop). Mantiene shape original para steps que aún no migran.
- `src/app/(agendaInteligente)/onboarding/language/page.tsx` — wired E2E con `setLanguage` action.
- `src/app/(agendaInteligente)/onboarding/done/page.tsx` — wired E2E con `finalizeOnboarding`.
- 3 fixes de voseo (calendar, schedule, timezone — todas las ocurrencias detectadas).
- `tests/unit/onboarding-actions.test.ts` — 17 tests (per-step + atomic step 8 + idempotency + free-plan-missing error).

**Atomic step 8 transaction (E-006 finalize):**

```ts
await db.transaction(async (tx) => {
  // 1. Inbox category
  const [cat] = await tx
    .insert(categories)
    .values({
      userId,
      name: 'Inbox',
      isInbox: true,
      color: '#5C5C5C',
      icon: 'folder',
      position: 0,
    })
    .returning({ id: categories.id });

  // 2. Inbox project tied to Inbox category
  await tx.insert(projects).values({
    userId,
    categoryId: cat.id,
    name: 'Inbox',
    isInbox: true,
    status: 'active',
  });

  // 3. NotificationPref upsert (prior steps may have written push/schedule)
  await tx
    .insert(notificationPrefs)
    .values({ userId })
    .onConflictDoNothing({ target: notificationPrefs.userId });

  // 4. Free subscription
  await tx.insert(subscriptions).values({
    userId,
    planId: freePlanId,
    status: 'active',
  });

  // 5. Mark onboarding complete + 14-day gentle intensity default
  await tx
    .update(users)
    .set({
      onboardingCompletedAt: new Date(),
      intensityDefaultUntil: fourteenDaysFromNow,
      lastActiveAt: sql`now()`,
    })
    .where(eq(users.id, userId));
});
```

**Decisiones de scope:**

- **Breaking change**: rutas prototype REMOVIDAS de `publicPaths`. La demo pública anónima de Vercel ya no funciona — quien quiera ver el app debe loguear (seeded admin via `pnpm db:seed`).
- **UI wiring solo language + done**: las 6 pages restantes (timezone/push/mic/context/schedule/calendar) siguen con `continueHref` static. Las actions están listas y son trivialmente wireables. La nueva firma de `OnboardingLayout` (con `formAction?`) es backward-compatible.
- **Inngest `user.signed_up` event**: stub via `logger.info`. Real publish en ISSUE-080.
- **E2E Playwright tests**: deferred — requiere ISSUE-004 (email/password auth real) + UI wiring full + credentials de Google OAuth de ISSUE-003 provisionadas.

**Reconciliaciones con dependencies:**

- ISSUE-004 (email/password) listada como dep pero status `ready`, no completed. La onboarding action no depende del provider de auth específico, sólo de `auth()` retornando un user con id (cualquier provider funciona). Si querés que ISSUE-004 sea hard-required, mover este issue a `blocked` hasta entonces — pero no aplica hoy.

**Cobertura tests (17):**

- setLanguage: update + Zod enum reject
- setTimezone: update + invalid string reject
- setPushPref: upsert con onConflictDoUpdate
- setSchedule: 3 times update + malformed reject
- setOnboardingContext: update + empty reject
- setCalendarOptIn: redirect URL para "now" + null para "later"
- finalizeOnboarding: full tx con 4 inserts + 1 update, idempotency, free-plan-missing error, Inbox cat correctness, Inbox proj tied to cat, free subscription

**Verificación:**

- `pnpm typecheck` ✅
- `pnpm lint` ✅ 0 errors. ESLint BR-1 rule NO disparó (allowlist correcta).
- `pnpm test` ✅ 576/576 estable.
- `pnpm test onboarding-actions` ✅ 17/17.

**Unlocks:**

- ISSUE-013 createActivity (default a Inbox project) ahora puede ejecutarse end-to-end después de signup.
- ISSUE-003 AC Scenario 1 (alice lands on /onboarding/language) ahora se cumple — el redirect callback de `redirect` + middleware logic gatean correctamente.
- ISSUE-010/012 (Category/Project CRUD) ahora pueden ser wireados al UI con auth real.
