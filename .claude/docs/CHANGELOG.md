# TimeKast Starter Kit — Changelog

> Registro de cambios y mejoras del Starter Kit.

---

## [6.0.0] - 2026-05-15 — Pair-split docs + Drift-absorption + Auth/Security/Discovery hardening

> Major release. Carga acumulada desde 5.6.0 (~6 semanas): migración kit-meta a pares `kb-*`/`sk-*` (EPIC-KIT-HYGIENE Track 2), primera ola del EPIC-DRIFT-ABSORPTION (mobile dialogs + E2E template), self-registration + postgres rate-limit en runtime, refactor mayor de `/discovery`.

### ⚠️ BREAKING CHANGES — Migration required for projects derived from <6.0.0

> Apps generadas antes de v6.0.0 **NO** pueden copiar `.claude/`, `.husky/` o `package.json` tal cual desde main. Hay que reconciliar manualmente — esta versión asume el path migration `docs/` → `project/` y la reestructuración de skills bajo prefijos `kb-*`/`sk-*`/`doc-*`/`tk-*`.

**Path migration `docs/` → `project/`:**

- Backlog, planning, reference, factory, migration ahora viven bajo `project/`. Husky hooks, skills y rules asumen el nuevo path.
- Acción requerida: renombrar `docs/{backlog,planning,reference,factory,migration}/` → `project/{...}/`. Ajustar referencias en commands y rules custom.

**Husky pre-commit (`.husky/pre-commit`):**

- Agregado `set -e` — el hook ahora aborta si `lint-staged` falla (antes seguía silenciosamente).
- Nuevos pasos: `pnpm generate:hooks` + `pnpm skill:lint`.
- Paths actualizados al esquema `project/`.

**`package.json` scripts:**

- Agregado `prebuild: pnpm generate:email-logo` — requiere `scripts/tools/generate-email-logo.ts`.
- `env:check` ahora ejecuta `tsx scripts/tools/env-check.ts` (antes inline node).
- Nuevos scripts requeridos en `scripts/tools/`: `env-check.ts`, `generate-email-logo.ts`, `generate-hooks.mjs`, `skill-lint/`, `board-status.ts`.
- Dev port default: 3000 → 3002 (config en `scripts/tools/dev.mjs`).

**Dependencies nuevas / bumpeadas:**

- Nuevas requeridas: `@tanstack/react-table ^8.21.3`, `recharts ^3.8.1`, `@testing-library/jest-dom ^6.9.1`, `@testing-library/react ^16.3.2`, `@testing-library/user-event ^14.6.1`.
- Bumped: `next 16.1.6 → 16.2.4`, `drizzle-orm 0.45.1 → 0.45.2`.
- Nuevo override: `picomatch ^4.0.4`.

**`.claude/` estructura:**

- Skills/rules/agents reestructurados. Prefijos `kb-*` (portable knowledge) / `sk-*` (kit shipped) / `doc-*` (documentation phase) / `tk-*` (workflows) / `fx-*` (factory-internal) ahora aplican.
- Copiar tal cual `.claude/` a un proyecto en 5.5.x o anterior va a chocar con rules existentes.

**Migration path sugerido:**

1. Fork temporal del estado actual del proyecto (rama `pre-v6-upgrade`).
2. Copiar `scripts/tools/` completo desde el kit v6.0.
3. Renombrar `docs/{backlog,planning,reference,factory,migration}` → `project/{...}`.
4. Copiar `.husky/` y reconciliar `package.json` scripts manualmente.
5. Reemplazar `.claude/` capa por capa: `rules/` → `skills/sk-*` → `skills/kb-*` → `agents/` → `commands/` → `hooks/`.
6. Correr `pnpm install && pnpm lint && pnpm typecheck && pnpm test` y debuggear iterativamente.

### 🧹 EPIC-KIT-HYGIENE — Track 2: Pair-split distills (5 issues, 2026-04-21..23)

- **KIT-011:** `component-catalog.md` + `layout-patterns.md` → `kb-ui` (portable patterns: Server/Client split, Suspense+Skeleton, a11y, cascading filter rule) + `sk-ui` (kit primitives: `DataTable`, `FormField`, `StatusToggle`, `BreadcrumbSetter`, `useTableState`, form kit at `@/components/form`, human-ID rule).
- **KIT-012:** `crud-scaffold.md` → 5-way split: `kb-ui` + `kb-api` + `sk-ui` + `sk-api` + new `sk-crud-scaffold` (orchestrator: URL convention, page shells, breadcrumbs, cascading filters).
- **KIT-013:** `features.md` → pair-aware domain split: RBAC → `kb-security`/`sk-security`; schema → `kb-db`/`sk-db`; server actions catalog → `kb-api`/`sk-api`; kit feature catalog → new `sk-features-index`.
- **KIT-014:** 3 new pairs: `kb-notifications`/`sk-notifications` (notify() API, SSE stream, VAPID push, `useNotifications`), `kb-navigation`/`sk-navigation` (12-field `NavItem`, `filterNavigationByRole`, Sidebar/BottomNav/BottomNavMoreSheet), `kb-pwa`/`sk-pwa` (Serwist at `src/app/sw.ts`, PwaUpdateToast, PwaInstallToast, IosA2hsHint).
- **KIT-015:** New `kb-design-tokens` (portable token-system patterns) + `sk-tokens-neomorphism` (CSS vars `--neo-*`, 3 themes light/dark/midnight, Tokens/Anti-tokens/Escalas tables) + `doc-visual-direction` §9 Handoff extended.
- **KIT-017:** Delta-check `security.md` (headers table → `sk-security` §10) + `e2e-testing.md` (zero-delta, covered by `sk-e2e`).

#### Docs removed

- `docs/reference/component-catalog.md`, `crud-scaffold.md`, `features.md`, `layout-patterns.md`, `navigation.md`, `security.md`, `e2e-testing.md` — replaced by `kb-*`/`sk-*` skills above.

#### Previously (2026-03..04, also under v6.0)

- **KIT-009:** `sk-*` prefix introduced in taxonomy (CLAUDE.md + CORE.md §3 + CC.md §6).
- **KIT-010:** Des-neomorphization of base docs (54 neo refs → 0) — design-system-agnostic first.
- **KIT-016:** `.claude/docs/` bucket introduced for kit-meta docs.
- **KIT-018:** Pair-split pattern formalized — 5 existing pairs documented in CC.md §6.

### 📊 EPIC-DATAVIZ — Charts + Tables shipped (1 issue, 2026-04-23)

- **VIZ-001:** `recharts@^3.8.1` + `@tanstack/react-table@^8.21.3` ahora shipped por el kit. `kb-dataviz` skill actualizada — ejemplos copy-paste-runnables, frontmatter sin "not installed" warnings. Side-fix: `@source not '../../project'` en `globals.css` (extensión de FF-002) para aislar backlog markdown del escaneo de Tailwind v4.

### 🩹 EPIC-DRIFT-ABSORPTION — Derivative drift absorbed (2 issues, 2026-05-15)

- **DRIFT-001:** Playwright E2E template — container path + `setup:e2e` tag substitution. Cierra workflow gap reportado por proyecto derivado.
- **DRIFT-002:** Mobile fixes en Dialog + AlertDialog. New `useDialogViewportFit` hook (visualViewport → `--dialog-vvh`) + `common/Dialog` + `common/AlertDialog` wrappers con layout mobile (`top-4` + max-h IME-aware) preservando desktop centered. `confirm-dialog.tsx` AlertDialogHeader override (`block text-left`). 5 consumers migrados. Absorbe FACTORY-001 + FACTORY-002 tickets del proyecto derivado.

### 🔐 Auth + Security

- **Self-registration end-to-end** (2026-05-05): form + endpoint + role gating, configurable por flag.
- **Postgres rate-limit backend** (2026-05-05): login + invites instrumentados, feature flag, docs en `.env.example`.
- **`withHumanIdRetry` + `getNextHumanIdSeq`** (2026-05-08): DB-native sequences en lugar de count-based humanIds + 23505 retry wrapper. Skill discipline en `sk-db`.

### 🔔 Notifications

- **Optimistic updates + cross-component invalidation** (2026-05-05).
- **Panel migrado a Radix Popover** (2026-05-04): fixes positioning + a11y heredados del Sheet anterior.
- **Polling visibility-aware** (2026-05-01): `useNotifications` solo polea con tab visible.
- **Panel + poll cap aligned a 20 items** (2026-05-15): `PAGE_SIZE` del endpoint y `MAX_ITEMS` del `NotificationPanel` ahora coinciden en 20 (antes 6/6). Endpoint expone `metadata` en el payload — tipo `Notification` extendido — habilita consumo de `metadata.*` en apps derivadas (ej. `cohost_invitation` con `inviteId`). A11y: `aria-label` en panel, `aria-hidden` en íconos decorativos, `sr-only "Sin leer"` para screen readers.

### 📧 Email

- **Logo como CID attachment** (2026-05-04): pre-generated module — sin runtime FS reads. Generated file `prettier-ignored` para evitar dirty round-trips.

### 🧭 /discovery workflow refactor

- **Methodology split + Phase 6.2/7.5 fixes** (2026-05-01): tk-discovery alineado con fx-workflow-authoring doctrine.
- **5 quick-win perf optimizations** (2026-05-01): reducción medible de wall-clock.
- **Sonnet alias para subagent model field** (2026-05-01).
- **Subagent prompts requieren explicit skill paths** (2026-04-29): regla CC.md §2.

### 📚 Knowledge base / skills

- **New `kb-ssot-registries` + `kb-cron-jobs`** (2026-04-29): portable knowledge.
- **`kb-cron-jobs` hygiene** (2026-05-03): JSON header-comment removed + vercel-shape invariant.

### 📦 PWA

- **Dev-only SW noise silenced** (2026-05-01): toast + log polling cleaned.

### 🛠️ Factory housekeeping

- **`factory-engineer` agent removed** + stale drift tickets cleaned (2026-05-05).
- **`factoryVersion` refs 5.x→6.0 aligned** + `.env.example` rate-limit docs (2026-05-05).
- **`/handoff` pre-creates transition dir** (2026-05-08): elimina permission prompt.
- **`env:check` + knip sweep + picomatch override** (2026-05-05).

### 🧪 Tests

- **NotificationBell + register E2E** failures fixed (2026-05-05).

---

## [5.6.0] - 2026-04-29 — Shell-wide pull-to-refresh

> **Source:** `FACTORY-FEEDBACK-001` from Aditivo CRM (derivative). Codex-reviewed (5+4 ajustes).

### Added

- `<PullToRefreshShell>` shell-wide PTR primitive in `src/components/pwa/`. Mounted once in `DashboardShell`, gated by `isMobile()`, hardcoded `router.refresh()` with deferred Promise resolve + 2s timeout fallback. New protected pages inherit PTR with no per-screen wiring.
- `ShellPTRProvider` + `useShellPTR` + `useDisableShellPTR` (counter-based) in `src/lib/pwa/shellPullToRefresh.tsx`. Multiple concurrent opt-outs compose safely — the shell only re-arms when ALL callers unmount.
- `isMobile()` capability-based helper in `src/lib/utils/platform.ts` (`(pointer: coarse) and (hover: none)`, SSR-safe with `matchMedia` guard).

### Changed

- `<PullToRefresh>` wrapper default gate flipped from `usePwaInstall().isInstalled` to `isMobile()`. Apps that need PWA-only pass `enabled={isInstalled}` explicitly. `enabled={true}` overrides the gate (useful in tests).
- `DashboardShell` mounts `<PullToRefreshShell />` once and applies `overscroll-y-contain` to its root `<div>` (escalation ladder documented in skill if Android Chrome native PTR persists).
- `/notifications` page calls `useDisableShellPTR()` to silence the shell while mounted — its data lives in client state and `router.refresh()` would not update it; the per-screen wrapper continues to handle the gesture.
- `sk-pull-to-refresh` skill rewritten — shell-wide is now the default mounting pattern. `sk-pwa`, `sk-features-index`, `sk-notifications` updated with cross-references.

---

## [5.5.1] - 2026-04-15

> 🩹 **Patch: Lifecycle Date Tracking + Tooling + Bugfix**

### 🔧 EPIC-FPX — Pipeline Extensions (1 issue)

- **FPX-007:** Lifecycle dates (`Created`, `Started`, `Completed`) in epics and issues — templates updated, enforcement in `/backlog` (Created), `/implement` coding (Started), `/implement` close (Completed). Smoke tests with `grep -qF`. Retrocompatible with pre-existing issues.

### 🔧 EPIC-SKT — Starter Kit Tooling (1 issue)

- **SKT-006:** Read-only DB query runner CLI (`pnpm db:query`) — allowlist security, table/schema discovery, JSON output

### 🐛 Fixes

- **Table pagination:** `useTableState` now resets page to 1 when external data length changes (e.g. filter applied)
- **Registry views:** `factory_release` workflow regenerates registry views during merge

### ⚙️ Agent Kit

- Metadata field count updated from 9 to 12 across SKILL.md and epic-generation.md

---

## [5.5.0] - 2026-04-13

> ✨ **Minor: Design System Enforcement + QC Hardening + Foundation Refactor**
>
> 4 epics, 28 issues, 53 commits.

### 🏗️ EPIC-FF — Factory Foundation (12 issues)

- **FF-001:** Tailwind v4 CSS variable syntax — safe abstract placeholders (`{utility}-(--{prop})`) in skill docs to prevent build crashes in projects without `@source not`
- **FF-002:** Exclude `docs/` and `.agent/` from Tailwind v4 source scanning
- **FF-003:** New `design-system-principles` skill — stack-agnostic anti-patterns (token usage, component reuse, scale consistency, multi-theme, surface hierarchy)
- **FF-004:** `webapp-testing` skill rewritten with 9 Hard Rules + RBAC patterns
- **FF-005:** Enforce `/backlog add` for issue creation (rule §5.11)
- **FF-006:** Safe grep rule — ban `**` glob in grep commands (rule §5.7)
- **FF-008:** No `--no-verify` and no push without authorization (rules §5.8, §5.9)
- **FF-009:** CORE.md refactored into 3-tier hierarchy: L1 Universal (`CORE.md`), L2 Runtime (`CORE-RT.md`), L3 Starter Kit (`CORE-SK.md`). Package-manager agnostic
- **FF-010:** `/init` tiered context loading — 58% less context usage
- **FF-011:** Consolidated `context-check.md` — DRY across all workflows
- **FF-012:** Checkpoint transparency pattern in `_shared/` — agents must announce loaded context at every gate

### 🔧 EPIC-FP — Factory Pipeline (4 issues)

- **FP-001:** Standardized `epic.template.md` with issue table format
- **FP-002:** Auto-inject design system ACs (DS1-DS4) into UI-related issues via backlog skill
- **FP-003:** `@ui-critic` enhanced from aesthetic reviewer to dual-purpose **Design System Compliance Auditor** (DS1-DS6 binary checks) + **Visual Quality Reviewer** (scoring). New `ui-critic-issue.template.md` for penultimate audit issue in UI epics. Added DS compliance check in `/audit` R2
- **FP-004:** Epic status auto-update enforcement in `/implement` close phase

### 🔧 EPIC-FPX — Pipeline Extensions (3 of 6 issues)

- **FPX-001:** Regression check in `/implement` QC — cross-references modified files against CODEBASE.md dependency map. Token validation greps UI files for hardcoded values when design system token map exists
- **FPX-002:** Verified auto-changelog in `/deploy` — confirmed working, closed
- **FPX-004:** Adaptive branching strategy — auto-detects project phase from `package.json` version (pre-release = main-first, post-release = develop-first)

### 🧪 EPIC-SKT — Starter Kit Tooling (5 issues)

- **SKT-001:** Story point totals in BOARD.md (per-epic and per-milestone)
- **SKT-002:** E2E `storageState` multi-role auth setup — per-role browser state files
- **SKT-003:** Dynamic RBAC test template — parametrized from project's `ROLE_CONFIG`
- **SKT-004:** Epic-level E2E test audit
- **SKT-005:** Server-side pagination with cached counts for large tables

### 🐛 Fixes

- **DropdownMenu layout shift on Windows:** Added `modal={false}` to Radix DropdownMenu in Header — prevents scrollbar removal that caused ~17px shift on Windows
- **E2E stability:** Neon branch sequence fix, auth timeout tuning, filter selector stabilization
- **TableFilter:** Backport scroll-close + neo badge shadow from Aditivo

### ⚙️ Agent Kit

- **v8.0.0 → v9.0.0:** 3-tier rules, design system enforcement, QC regression checks, checkpoint transparency

---

## [5.4.0] - 2026-04-08

> ✨ **Minor: Discovery Pipeline Stabilization + Factory Ops Knowledge Codification**

### 🔍 Discovery Pipeline (17 commits)

- **Hidden Chain Pattern:** Synthesis passes now use a hidden chain — `discovery.md` only loads `pass-1.md`, each pass has its checkpoint at the end + loader for the next pass. The model **cannot see** pass N+1 until the user approves pass N. Validated through 4 A/B runs.
- **WIP Reload:** Pass 2 and Pass 3 now explicitly reload all WIP files (`freeze-map.md`, `deep-dive.md`) + the current Brief before generating. Prevents context loss after hidden chain stops.
- **Feature Identification:** Added cross-reference verification step in freeze-map phase — every distinct capability must have its own FT-XXX. Prevents feature merging that reduces BR coverage.
- **Enrichment Questions:** New gap interview question type that explores depth of core features (premium capabilities, algorithms, config options). Minimum 2 per interview.
- **File Trim:** `discovery.md` reduced from 13,014 to 9,958 chars (2,330 under 12K limit) by removing redundant CONTEXT LOADED checklists and compressing ASCII blocks.
- **Turbo Chain Break:** Removed `// turbo` from synthesis pass-2 and pass-3 `cat` commands to prevent auto-chaining.
- **Terminology:** "Breathe Point" → "Checkpoint Light" across all workflow files.

### 📚 Factory Ops Skill

- **§3 Hidden Chain Enforcement:** Documented that listing steps sequentially in the parent workflow DOES NOT WORK — the model reads the full file and ignores intermediate checkpoints.
- **§4 Checkpoint Location:** Clarified that checkpoints go INSIDE pass files, not in the parent workflow. Parent checkpoints cause inflation and are ignored.
- **§6 Pattern A (Multi-Pass):** Renamed to "Hidden Chain", added mandatory implementation diagram with anti-pattern documentation.

### ⚙️ Agent Kit

- **v7.0.1 → v8.0.0:** Major — Discovery pipeline stabilization, hidden chain pattern, factory-ops codification.

---

## [5.3.1] - 2026-04-07

> 🩹 **Patch: Rules Consolidation + Claude Code Integration + Agent Kit 7.0.1**

### 🔒 Rules & Enforcement

- **CORE.md consolidation:** Merged 5 always-on rule files (`00_global`, `04_complementary`, `GEMINI`, `ROUTING`, `HIERARCHY`) into single `CORE.md` — eliminates context bloat and circular references
- **Routing enforcement hardened:** Pipeline completeness checks + stronger agent loading requirements

### ✨ Features

- **`.claude/` workflows:** Added Claude Code integration with stateful Discovery pipeline (8 phases, templates, progress tracking)
- **`/deploy` workflow:** New deployment workflow + glossary + `version: 0.0.0` convention for derived apps
- **`/proposal` neutral language:** Skeptical-client agent + neutral tone enforcement

### ⚙️ Agent Kit

- **v7.0.0 → v7.0.1:** Routing enforcement + pipeline completeness improvements

### 🏭 Backlog

- **Milestone renamed:** `v5.4` → `v5.3.1` to align with patch scope

---

## [5.3.0] - 2026-04-05

> ✨ **Minor: Workflow Flattening + Agent Kit v6**

### ✨ Features

- **AGT-001 — Flatten workflow phases:** Removed redundant `phases/` subdirectory from 8 workflows (audit, backlog, design, discovery, docs, implement, proposal, validate_docs). Updated all `cat` paths. Preserved functional subdirs (`generation/`, `extended/`).
- **Agent Kit v6.0:** Major version push with flattened workflow structure
- **Legacy cleanup:** Removed deprecated workflow files and unused phase references

---

## [5.2.0] - 2026-03-27

> ✨ **Minor: Avatar Upload + Vercel Deploy + RBAC Hardening + Workflow Improvements**

### ✨ Features

- **FEAT-001 — Avatar Upload + DB Storage:** Full avatar management pipeline — server-side resize (128×128 WebP via `sharp`), base64 storage in `avatar_data` column, API route (`GET /api/avatar/[userId]`) with 24h cache headers, `AvatarUpload` component with click + drag-and-drop, cache busting via `?v=timestamp`. OAuth image guard in `signIn` callback + `linkAccount` event prevents overwriting custom avatars.

### � Vercel Auto-Deploy (DEPLOY-001)

- **`getAppUrl()` helper:** Centralized URL resolution with auto-detection: `NEXT_PUBLIC_APP_URL` > `VERCEL_PROJECT_PRODUCTION_URL` > `VERCEL_URL` > `localhost:3000`. Refactored 9 consumers.
- **`push-env-vercel.mjs`:** Push `.env.local` vars to Vercel via REST API. Features: auto `vercel link`, `DATABASE_URL_POOLER` override, `--clean`, `--dry-run`, `--verbose` flags.
- **Auth `trustHost` auto-detect:** Uses `process.env.VERCEL` — prevents `UntrustedHost` error without manual env var.

### 🔐 Auth RBAC Hardening

- **FIX-004 — Auth callback split:** Moved JWT/session callbacks to `auth.config.ts` (Edge-safe) so middleware gets `req.auth.user.role`. Prevents silent RBAC failures.
- **FIX-005 — Route ACL scaffold:** `ROUTE_ACL` map + `isRouteAllowed()` helper in `permissions.ts`. 2-layer pattern: Route ACL (who sees pages) vs Resource Permission (who does actions).
- **PWA Update Toast fix:** Added `navigator.serviceWorker.controller` guard to prevent false "Nueva versión" toast on first install.

### 🔒 Rules & Enforcement

- **FIX-006 — Workflow Literal Execution:** New HARD LIMIT rule (§10 in `04_complementary.md`) — agent must `cat` workflow files before execution, no memory execution.

### ⚙️ Workflow Improvements

- **`/init` redesign:** Leaner, BOARD.md as SSOT, no invented data
- **`/implement` hardened:** Mandatory context check before handoff, reorganized phases
- **`/factory_release`:** Mandatory CHANGELOG review gate added
- **`project-config.md`:** YAML frontmatter for structured metadata (FOUND-001)

### 🐛 Fixed

- **FIX-003 — 3 SK bugs bloqueantes en fresh install:** `setval` crash, wrong seed paths, hardcoded `humanId`
- **`next/image` + local API URLs:** Avatar URLs with query strings → `unoptimized` prop fix
- **Flaky E2E search input** (strict mode with duplicate inputs)

### 📦 Dependencies

- Added `sharp` (production) for server-side image processing

### 🧪 Tests

- 262 unit tests (22 files, all passing) — +8 `isRouteAllowed` + 5 `getAppUrl()` tests
- 25 E2E tests (all passing)

---

## [5.1.3] - 2026-03-24

> 🩹 **Patch: Auth RBAC Hardening + Route ACL Scaffold**

### 🐛 Fixed

- **FIX-004 — Auth callback split (middleware gets undefined role):** Moved JWT/session callbacks to `auth.config.ts` (Edge-safe) so middleware's NextAuth instance has `req.auth.user.role` available. `auth.ts` composes with the base for DB-dependent image sync. Explicitly inherits `session` and `authorized` callbacks (JS spread doesn't deep-merge).

### ✨ Added

- **FIX-005 — Route ACL scaffold:** `ROUTE_ACL` map + `isRouteAllowed()` helper in `permissions.ts`. Integrated in `authorized()` callback. Projects fill the map with their routes — 2-layer auth pattern: Route ACL (who sees pages) vs Resource Permission (who does actions).
- **Security skill:** 5 new sections — split-config pattern, 2 pitfalls (missing callbacks, no deep merge), RBAC placement in `authorized()`, Route ACL vs Resource Permission distinction.

### 🧹 Maintenance

- Removed unused Next.js default SVGs (`public/*.svg`)
- Fixed flaky E2E search input (strict mode with duplicate inputs)
- Fixed push-env-vercel.mjs inline comment stripping for quoted values

### 🧪 Tests

- 262 unit tests (22 files, all passing) — +8 new `isRouteAllowed` tests
- 25 E2E tests (all passing)

---

## [5.1.2] - 2026-03-24

> 🩹 **Patch: Vercel Deploy Pipeline + Critical Bugfixes**

### 🚀 Vercel Auto-Deploy (DEPLOY-001)

- **`getAppUrl()` helper:** Centralized URL resolution with auto-detection: `NEXT_PUBLIC_APP_URL` > `VERCEL_PROJECT_PRODUCTION_URL` > `VERCEL_URL` > `localhost:3000`. Refactored 9 consumers across config files, email templates, auth, and API routes.
- **`push-env-vercel.mjs`:** New script to push `.env.local` vars to Vercel via REST API. Features: auto `vercel link` prompt, `DATABASE_URL_POOLER` override, production/preview/development target classification, `--clean`, `--dry-run`, `--verbose` flags.
- **`vercel.json`:** Placeholder config with `crons: []`.
- **`.env.example`:** Added `VERCEL_TOKEN` and `DATABASE_URL_POOLER` section.

### 🐛 Fixed

- **FIX-003 — 3 SK bugs bloqueantes en fresh install:**
  - `setval` crash in migration for `humanId` sequences
  - Wrong seed script paths in `package.json`
  - Hardcoded `humanId` in admin seed

- **Auth trustHost auto-detect:** `trustHost` now auto-detects Vercel via `process.env.VERCEL` (always set by Vercel runtime) — prevents `UntrustedHost` error without requiring manual `AUTH_TRUST_HOST=true` env var.

- **FIX-004 — Auth callback split (middleware gets undefined role):** Moved JWT/session callbacks to `auth.config.ts` (Edge-safe) so middleware's NextAuth instance has `req.auth.user.role` available. `auth.ts` composes with the base for DB-dependent image sync. Prevents silent RBAC failures in middleware.

### 🧪 Tests

- 254 unit tests (22 files, all passing) — +5 new `getAppUrl()` tests

---

## [5.1.1] - 2026-03-20

> 🩹 **Patch: PWA Bugfix + Backlog Quality**

### 🐛 Fixed

- **PWA Update Toast false positive:** Toast "Nueva versión disponible" appeared incorrectly when reopening the PWA or after browser evicts the SW (common on iOS/Safari). Added `navigator.serviceWorker.controller` guard to distinguish first install from real update.

### 🏭 /backlog Pipeline (WF-022)

- **Owner field:** Added to issue template + SKILL.md assignment rules
- **Anchor links:** Doc references require anchor links (🔴 BLOCKER)
- **Mandatory fields expanded:** SK Leverage, Implementation Evidence, Commits now mandatory
- **Quality minimums table:** Expanded 7→12 fields
- **Consolidation check:** Added Pregunta 6 to gap-analysis
- **Owner detection:** Auto-detect from Discovery Brief in context-loading
- **Registry:** Added `project_setup` combo to `registry.yaml` (SSOT)

### ⚙️ Agent Kit

- **v5.0.9 → v5.0.10**

---

## [5.1.0] - 2026-03-20

> ✨ **Minor: /docs & /design Pipeline Anti-Degradation**

### 📄 /docs Pipeline Hardening (WF-011 → WF-019)

- **WF-011:** Cross-validation entre documentos generados en pipeline
- **WF-012:** `/validate_docs` reforzado con patrones MEGA_AUDIT
- **WF-013:** Hard checkpoints entre batches de docs + project context loading
- **WF-014:** Batch restructuring + quality floor para User Stories
- **WF-015:** Per-batch template loading + write-then-append pattern
- **WF-016:** Split Batch 6 en 6+7 con hard checkpoint
- **WF-017:** Pipeline audit fixes (correcciones de auditoría)
- **WF-018:** Restore sub-batch `notify_user` checkpoints
- **WF-019:** Anti-degradation full refactoring del docs workflow

### 🎨 /design Pipeline Fracture (WF-020 → WF-021)

- **WF-020:** Fractura `generation.md` monolítico en archivos per-pass (anti-degradation)
- **WF-021:** §0.1 SK Style Migration Assessment + Creative Freedom + Inter-Pass Checkpoints

### 🧹 Maintenance

- **generation.md trimming:** 2 refactors para reducir a límite de 12K chars
- **ROUTING.md:** Alineado precedence con `registry.yaml` SSOT
- **Enforcement banners:** 🔴🔴🔴 banners antes de cada batch header
- **US sub-batch size:** Reducido a 1-2 epics por write call (anti context overflow)

### ⚙️ Agent Kit

- **v5.0.7 → v5.0.9**

---

## [5.0.0] - 2026-03-19

> 🏗️ **Major: Agent System v5 — Registry + Workflow Refactoring**

### 📋 EPIC-REGISTRY — Centralized Agent Registry (REG-001 → REG-016, 40 SP)

- **REG-001:** `registry.yaml` SSOT — 29 agents + 48 skills con keywords bilingual, combos, dimensions, fallbacks
- **REG-002:** `/factory_agents` workflow + `registry_cli.py` CLI (add/rebuild/validate)
- **REG-004/005:** Migración `/backlog` full + add → REGISTRY views
- **REG-006/007:** Pipeline refs y `ROUTING.md`/`CONTENTS.md` simplificados
- **REG-008:** `/implement` loading model refactorizado a REGISTRY
- **REG-010:** Legacy MAPPING files eliminados (`AGENTS_MAPPING.md`, `SKILLS_MAPPING.md`)
- **REG-011:** Integration testing pipeline
- **REG-012:** Backfill subcommand en `registry_cli.py`
- **REG-013:** Activation modes (`auto`, `explicit_only`) en agents + skills
- **REG-014:** 5 nuevos combos + `design-system-lead` explicit_only
- **REG-015:** Skills redundantes eliminados (`tdd-workflow`, `lint-and-validate`)
- **REG-016:** CLI respeta `activation_mode`

### 🔧 EPIC-WF — Workflow Refactoring (WF-001 → WF-010, 26 SP)

- **WF-001→005:** Todos los workflows refactorizados a fases secuenciales (`/docs`, `/design`, `/discovery`, `/proposal`, `/backlog`)
- **WF-006:** Cleanup crosscutting (legacy docs, agent announcements en CP1)
- **WF-007:** Mejorar calidad de generación `/design`
- **WF-008:** Fracturar generación `/docs` en 4 batches (anti context-degradation)
- **WF-009:** 7 mejoras al design pipeline (post-mortem v3): checklist post-validation, cache model, traceability FT→SCR, OQ inheritance, deferred items, DD data impact, interaction states
- **WF-010:** Template `project-config.md` reescrito — 9 secciones (Info, Problem, Stakeholders, Stack, Glossary, External Systems, Integrations, Rules, Commands)

### 🧹 Agent System Cleanup

- Eliminados `AGENT_FLOW.md`, `USAGE_GUIDE.md` (legacy)
- `ARCHITECTURE.md` reescrito
- Heredoc ban rule (`04_complementary §9`)
- 2 batches de audit fixes (9+ fixes cada uno)
- `/implement` QC: mandatory file summary

### ⚙️ Agent Kit

- **v3.1.0 → v5.0.2:** Smart install, clean install en major (rm + fresh), project/ backup/restore, push mode warnings

---

## [4.1.0] - 2026-03-16

> ✨ **Minor: Discovery Workflow Redesign**

### 🔍 Discovery System v3 (11 files)

- **New `discovery-expert` agent:** Anti-drift rules, source classification protocol, decision freeze, confidence tagging, adaptive interview rules
- **6 cognitive phases:** Source Intake → Freeze Map → Gap Interview → Synthesis Draft → Challenge Pass → Final Brief (replaces old section-by-section approach)
- **Metrics reordered:** Source Fidelity > Drift Control > Gap Clarity > Consistency > Traceability Density > Structural Completeness
- **§11 = Visual Direction Seeds** (content section for `/design` downstream). Reconciliation = Appendix A (mechanical cross-check)
- **Conditional loading profiles:** D0 light, D1 standard, D1 legacy-heavy, D2 brief-audit — prevents context bloat
- **Bulk attachments:** Never silent sampling, allows explicit partitioning/prioritization
- **Challenge Pass:** 3 distinct output shapes per agent (value/scope, reversibility/constraints, sequencing/dependencies)
- **Template §5.2 neutralized:** Service examples marked as common options, not defaults — prevents stack gravity
- **Resolution states:** Firm, Resolved During Discovery, Working Hypothesis, Deferred, Open Question — replaces binary open/firm
- **Post-checkpoint reconciliation:** OQs must be reclassified before drafting (prevents silent upgrades to Firm)
- **Template:** +Resolved During Discovery and +Working Hypotheses sections
- **Auto-commit softened:** Now recommended action, not automatic — respects heavy OQs/assumptions
- **2 hard checkpoints** (down from 4-5) — less friction, more meaningful stops
- **Routing updated:** `discovery-expert` in ROUTING.md and AGENTS_MAPPING.md (32 agents total)
- **Hardcoded cleanup:** Removed project-specific references from factory templates

### ⚙️ Agent System

- **Agent Kit v3.1.0:** Published + integrated

---

## [4.0.0] - 2026-03-15

> 🏗️ **Major: Project Restructuring — src/ Migration**

### 🏗️ EPIC-RESTRUCTURE (7 issues, STRUCT-001→007)

- **STRUCT-001:** Dead code cleanup — removed demo page, showcase components, unused imports
- **STRUCT-002:** `git mv` components/ + lib/ into src/ — all application code now under `src/`
- **STRUCT-003:** Unified config — merged `lib/config/` and `src/config/` into single `src/config/`
- **STRUCT-004:** Verified/fixed tsconfig aliases and vitest config for new paths
- **STRUCT-005:** Created comprehensive `docs/guides/project-structure.md` guide (SSOT)
- **STRUCT-006:** Updated 10 documentation files with 145+ path renames
- **STRUCT-007:** Migrated catch-all alias `@/*` from `./*` → `./src/*` for import discipline

### 📚 Project Structure Guide (New)

Complete architectural guide covering:

- Feature Slices (`src/features/`) as optional escalation pattern
- Shared vs Domain classification with dependency rules
- `lib/` scope (SÍ/NO tables)
- Test co-location for feature slices
- Migration path from global to feature slices
- Anti-patterns (12 rules)
- Path aliases table

### 🧹 Dead Code Cleanup

- Deleted 3 dashboard demo components (QuickActions, RecentUsersTable, StatsCards) + skeletons
- Removed `testNotification` debug function + unused imports
- Removed stale "Demo Showcase" quicklink to deleted `/demo` page
- Cleaned 6 stale entries from `knip.json` ignore list
- Added `seed.ts` to knip ignore (manually executed)
- **Result:** Knip reports 0 issues

### 📦 Dependencies

- Updated 25+ packages (Sentry, Playwright, Tailwind, Vitest, etc.)
- Resolved 14 of 17 dep vulnerabilities (9 high + 1 critical → 0)
- 3 remaining vulns (low/moderate) accepted — all from `@lhci/cli` devDep

### 📄 README

- Project structure tree aligned with new `src/` layout
- Fixed `AI_RULES.md` reference → `.agent/rules/`
- Added link to `docs/guides/project-structure.md`

### ⚙️ Agent System

- Agent Kit v3.0.5 integrated
- Workflow context loading updated for project-structure and design-system guides

---

## [3.3.1] - 2026-03-13

> 🩹 **Patch: Cascading Filters**

### ✨ Features

- **Cascading filters (UserTable):** Role/status filter options now derived via `useMemo` from cross-filtered data — only shows options that produce non-empty results
- **Cascading filters (Notifications):** Server-side facets via `DISTINCT` queries in `getNotifications()` — categories and statuses cascade based on the other active filter

### 📚 Documentation

- **crud-scaffold.md:** Layer 6 — "Cascading Filters" section with mandatory rule, code pattern, and anti-patterns
- **04_complementary.md:** Rule §8 — enforcement for AI agents: never hardcode filter options when 2+ filters exist

### ⚙️ Agent System

- **Agent Kit v3.0.3:** Published + integrated

---

## [3.3.0] - 2026-03-13

> ✨ **Minor: RBAC Role Configuration + Invite Role Selection**

### 🔐 RBAC Enhancements (EPIC-RBAC — 2 issues, 10 SP)

- **RBAC-001:** Consolidated `ROLE_CONFIG` as SSOT — centralizes `displayName`, `canInvite`, `assignableRoles`, and `style` per role. All role functions now read from single config. Added `canInvite()` utility. `ROLE_STYLES` deprecated.
- **RBAC-002:** Invite role selection — `/api/invites/send` accepts optional `role` param, validated against `ROLE_CONFIG.assignableRoles`. Role stored in `metadata.role` (zero migrations). Accept route reads metadata with `getDefaultRole()` fallback. UI role selector in `InviteUserDialog`.

### 🐛 Fixed

- **Dark theme:** `destructive-foreground` set to white text in dark mode global CSS

### 📚 Documentation

- **features.md:** §1.4 (RBAC) updated with `ROLE_CONFIG` pattern, §1.6 (Invites) updated with `metadata.role`, §5 (API) updated with role param, §11 (How to Extend) updated with new role/capability instructions

---

## [3.2.0] - 2026-03-13

> ✨ **Minor: UI Quality Audit + Agent Kit Integration + Design System Docs**

### 🎨 Design System Quality (EPIC-UIQA — 13 issues, 33 SP)

- **UIQA-001→003:** Unified neo shadow syntax across all components, fixed Input, aligned SkeletonCard
- **UIQA-005/006:** Design System Guide + dropdown-menu shadow unification
- **UIQA-007→011:** Form inputs, buttons, badges, overlays migrated to neo tokens; legacy shadow leaks removed from dashboard/admin
- **UIQA-012:** FormSelect migrated from native `<select>` to Radix Select + RHF Controller
- **UIQA-013:** Table component — all inline `style={{}}` → Tailwind arbitrary values, JS hover → CSS `:hover`
- **UIQA-014:** Overlay opacity unified to `bg-black/40` across Dialog, Sheet, AlertDialog
- **UIQA-015:** Sidebar hover feedback upgraded to `neo-outset-sm`
- **UIQA-016→018:** SkeletonTable neo wrapper, Switch thumb neo token, FormField dead border removed

### 📚 Documentation Overhaul

- **design-system.md:** Complete Neomorphism 2.0 guide — tokens, utility classes, decision table, known exceptions, See Also links
- **crud-scaffold.md:** Fixed stale inline style recommendations, corrected Input/Select pattern to class notation, ghost button active state
- **component-catalog.md:** Added TableFilterBar section, updated FormSelect with Radix migration note
- **layout-patterns.md:** Added detail page, form card, and tab content patterns (5→8 total)
- **features.md:** FormSelect noted as Radix-based internally

### ⚙️ Agent System

- **Agent Kit v3.0.2:** Integrated into main branch (previously develop-only)
- **Design agents:** `visual-design-director`, `layout-composer`, `ui-critic`, `design-engineer` added
- **Release workflow:** Simplified — `.agent/` now merges to main, removed exclusion logic (21→17 steps)

### 🔧 Refactors

- **Headless UI → Radix:** Fully migrated (`@headlessui/react` removed)
- **TableFilterBar:** Slots API refactored for better composability
- **Table inline styles → Tailwind:** `bg-(--table-header-bg)`, `shadow-(--neo-outset-sm)` class-based

---

## [3.1.0] - 2026-03-07

> ✨ **Minor: Loading Skeletons + Agent Routing v2**

### ✨ Features

- **UX-004:** Layout-aware loading skeletons for Users list, User detail, and Profile pages
- **crud-scaffold.md:** Added Layer 4.5 (Loading Skeleton) as mandatory requirement for every CRUD module
- **Agent Routing v2:** Mandatory `Agents:` field in issues — explicit agent assignment with autodetect supplement and dedup

### ⚙️ Agent System

- **AGENTS_MAPPING v2:** New agents (`data-modeler-drizzle`, `pwa-engineer`, `design-system-lead`), §5 rules for explicit assignment, fullstack fallback (`backend-specialist` + `frontend-specialist`)
- **SKILLS_MAPPING v1:** Centralized skill mapping with `domains/` and `kit/` categories
- **issue.template.md:** Added `Agents:` field alongside existing `Skills:` field
- **CHECKPOINT 1:** Now displays 🤖 Agents + 🧰 Skills loaded, enforces minimum 1 of each
- **Cleaned 8 redundant agents:** `auditor`, `delivery-manager`, `fullstack-engineer`, `product-strategist`, `project-architect`, `solution-architect-functional`, `solution-architect-technical`, `tech-lead`

### 🔧 Workflow Optimizations

- **`context.md`:** Trimmed 14.5KB → 12KB (condensed Phase 0.5, merged turbo blocks, stripped comments)
- **`generation.md`:** Trimmed 12.7KB → 11.2KB (removed verbose issue examples)
- **`/backlog add`:** Loads `AGENTS_MAPPING.md`, validates mandatory agent+skill selection

---

## [3.0.6] - 2026-03-06

> 🩹 **Patch: SMTP Serverless Fix + Workflow Improvement**

### 🐛 Fixed

- **EMAIL-007:** SMTP logo attachment crash on Vercel serverless — `resolveLogoAttachment()` now checks `existsSync` before attaching, gracefully skips when `public/` is unavailable
- **`.env.example`:** Documented `EMAIL_LOGO_URL` for production serverless environments

### ⚙️ Workflow

- **`/backlog add`:** Added explicit `// turbo` + `cat` commands with full paths (prevents wrong directory lookups), included `SKILLS_MAPPING.md` loading, warning against generic `plan-writing` skill

---

## [3.0.5] - 2026-03-06

> 🩹 **Patch: Board Improvements, Rules Cleanup, Workflow Enhancements**

### 📊 Board (`scripts/tools/update-board.ts`)

- **Global Summary:** Cross-milestone status counts at top of BOARD.md
- **Milestone Progress Table:** Per-milestone % with emoji indicators (✅/🟡/🔵)
- **Straggler Detection:** Warns about pending issues in 80%+ done milestones
- **M\* support:** `extractMilestone` now detects both `v*` and `M*` directories

### 📜 Rules (`.agent/rules/`)

- **Renamed:** `.mdc` → `.md` for all rule files
- **00_global:** Removed hardcoded 'TimeKast', fixed `GITHUB_BACKLOG` → `BOARD.md`, clarified PowerShell `&&` restriction, `reusable-library.md` → `INVENTORY.md`, GitHub Issues → backlog issues
- **02_nextjs:** Server Actions example now uses `withAuth()`/`withSelf()` helpers
- **03_drizzle:** `db:push` → `db:migrate` in migration flow, soft delete with full audit fields
- **GEMINI.md:** Softened Socratic Gate, removed Turkish triggers, replaced phantom scripts with native `pnpm` commands + 3 real scripts, removed Gemini Mode Mapping
- **HIERARCHY.md:** Added (replaces deleted README.md)

### ⚙️ Workflow

- **`/factory_release`:** Added explicit `factoryVersion` bump step + "NEVER bump on main" rule
- **`version` field:** Fixed from `3.0.4` → `1.0.0` (was incorrectly tracking factoryVersion)

---

## [3.0.3] - 2026-03-03

> 🩹 **Patch: E2E Runner Hardening + Orphan Branch Prevention**

### 🧪 E2E Runner (`scripts/tools/e2e-runner.ts`)

- **`PLAYWRIGHT_HTML_OPEN=never`:** Prevents Playwright from opening a blocking report server before cleanup runs
- **Shared `cleanup()` with guard:** Extracted cleanup logic into idempotent function — safe to call from both `finally` and signal handlers
- **SIGINT/SIGTERM handlers:** Registered before branch creation — ensures Neon branch cleanup on `Ctrl+C`
- **Report opens AFTER cleanup:** HTML report only opens after server stop + branch deletion, preventing orphan branches

### ⚙️ Playwright Config (`playwright.config.ts`)

- **Workers:** `undefined` → `2` locally (avoids Turbopack cold-compile conflicts with 4+ workers)
- **Retries:** `0` → `1` locally (handles transient ECONNRESET errors)
- **Timeout:** default → `60s` (accommodates Neon branch latency + cold start)
- **Action timeout:** default → `15s` (more tolerant clicks/fills)
- **Navigation timeout:** default → `30s` (more tolerant `page.goto`)

### 🔧 Config

- **E2E port:** `3005` → `3006` in `package.json` (avoid conflicts)

### 🧹 Maintenance

- **Cleaned 9 orphan `e2e-*` Neon branches** from Feb 14–22 (one-time)

---

## [3.0.2] - 2026-02-25

> 🩹 **Patch: Unsaved Changes Guard + CRUD/Docs Alignment**

### 🛡️ Unsaved Changes Protection

- **Global provider:** Added `UnsavedChangesProvider` in root `Providers.tsx`
- **Reusable hook:** Added `useUnsavedChangesGuard` for form-level dirty state registration and guarded navigation
- **Internal navigation modal:** Added confirmation dialog for in-app navigation when there are unsaved changes
- **Browser protection:** Added native confirmation for tab close/refresh (`beforeunload`) and browser back/forward

### 🧩 CRUD Integrations

- **Users create/edit forms:** Integrated guard in `NewUserContent` and `UserDataTab`
- **Profile form:** Integrated guard and reset-after-save behavior to avoid false dirty state
- **Navigation semantics:** Standardized `confirmNavigation()` for cancel actions and `allowNavigation()` after successful save

### 🎨 UI

- **Unsaved dialog CTA:** Changed from warning (yellow) to default/primary style for better visual consistency

### 📝 Documentation

- **`features.md`:** Added core feature section for Unsaved Changes Guard and hook inventory update
- **`component-catalog.md`:** Added `useUnsavedChangesGuard` API and usage pattern
- **`crud-scaffold.md`:** Added required unsaved-changes pattern for Create/DataTab flows, anti-patterns, and checklist items

---

## [3.0.1] - 2026-02-23

> 🩹 **Patch: Accessibility, Filter Bar Layout, Docs**

### ♿ Accessibility

- **Password toggle buttons:** Added `aria-label` across 4 forms (LoginForm, ResetPasswordForm, AcceptInviteForm, NewUserContent)
- **Login links:** Changed from `hover:underline` to always-visible underline — fixes "links rely on color" Lighthouse audit

### 🎨 UI

- **TableFilterBar:** Desktop layout now uses 2 explicit rows (search+actions / filters) instead of single wrapping row — prevents random filter splitting at medium widths

### 📝 Docs

- **getting-started.md:** Added reminder to replace Factory README.md with a project-specific one
- **project-config.md:** Removed hardcoded versions — `package.json` is SSOT

### 🔧 DX

- **`/factory_release` workflow:** New standardized release workflow with 3 mandatory STOP gates

---

## [3.0.0] - 2026-02-23

> 🔔 **Notifications System + Documentation Overhaul + Quality**

### 🆕 Notification System (NOTIF-001 → NOTIF-021)

Full real-time notification system with 3 channels:

- **Schema (NOTIF-001/002):** `notifications`, `notification_preferences`, `push_subscriptions` tables. 6 categories × 3 channels with per-user preferences.
- **Core Service (NOTIF-003):** `notify()` function dispatches to in-app, push, and email based on user prefs. Respects category locks and channel availability.
- **Email Channel (NOTIF-004):** `notificationEmail()` template with category badge, optional CTA. Plain text fallback.
- **SSE Real-time (NOTIF-005):** `/api/notifications/stream` with SSE for instant in-app delivery + polling fallback.
- **Push Notifications (NOTIF-006/007):** web-push VAPID integration. SW handles `push` events with notification click → `postMessage(SW_NAVIGATE)` → client-side navigation.
- **Client Hooks (NOTIF-008):** `useNotifications()`, `usePushSubscription()`, `useSSE()` — composable hooks for notification UI.
- **Components (NOTIF-009→015):**
  - `NotificationItem` — Category badge, time-ago, read/unread states
  - `NotificationBell` — SSE-powered badge counter in header
  - `NotificationPanel` — Dropdown with latest 6, "Ver todas" link
  - `NotificationSettings` — Matrix of categories × channels with per-channel global toggles
  - `PushPermissionPrompt` — Sheet for push opt-in
- **Full Page (NOTIF-012):** `/notifications` with search, category/status/date filters, pagination, bulk actions (read/unread/delete) with selection mode.
- **Preferences (NOTIF-013):** Per-user notification preferences in profile tab. Matrix UI with category locks.
- **Test Action (NOTIF-017):** Demo section in `/demo` for sending test notifications per channel/category.

### 🆕 UI Components & Patterns

- **NeoCheckbox:** Neumorphic checkbox with inset/raised states and animations
- **Button `neo` variant:** Outset button style for login and action buttons
- **CollapsibleTableFilterBar:** Auto-collapses filters on mobile with expand button
- **PageSize selector:** Dynamic rows-per-page in DataTable pagination
- **Header dropdowns:** Migrated HeadlessUI → Radix (UXUI-006)
- **Users collapsible filters:** Responsive filter bar for mobile

### 🐛 Fixed

- **UserNavigator "0 de N":** Rewritten `getAdjacentUsers()` with CTE + `ROW_NUMBER`/`LAG`/`LEAD` window functions. Root cause: JS Date (ms) vs PostgreSQL timestamptz (µs) precision mismatch.
- **SW Lifecycle:** Switched to managed updates (`skipWaiting:false`). Prevents ChunkLoadError on version changes.
- **SW NetworkOnly firewall:** Removed catch-all rules that intercepted navigations/RSC/API.
- **SW notification click:** `postMessage(SW_NAVIGATE)` instead of `client.navigate()`.
- **OAuth password:** Users who registered via OAuth can now set an initial password from profile.
- **Login Enter key:** Form now submits on Enter.
- **Pagination mobile overflow:** Fixed on small screens.
- **Header Radix dropdown regressions:** Fixed after HeadlessUI migration.

### 📚 Documentation Overhaul (DX-001 → DX-007)

Major documentation consolidation — **18+ docs → 13 docs, -662 lines net:**

- **Deleted 5 redundant docs:** `deployment.md`, `email-deliverability.md`, `reusable-library.md`, `neumorphic-elevation.md`, `branding.md`
- **Reorganized:** Moved `navigation-guide`, `e2e-testing`, `sw-updates` from `guides/` → `reference/`. Renamed `mobile-patterns` → `layout-patterns`.
- **Merged:** Neumorphic elevation → `component-catalog.md` §8. Branding → `getting-started.md` §6.
- **Reduced:** `troubleshooting.md` (460→120 lines, -74%), `security.md` (251→70 lines, -72%)
- **Rewritten:** `getting-started.md` — complete SK overview, corrected `db:push`→`db:migrate`, demo removal checklist, branding guide.
- **Rewrote:** `navigation-guide.md`, `crud-scaffold.md` (v3.0 rewrite with notification patterns), `notifications.md` (full reference)
- **New:** `project-config.md` — centralized project context for AI agents
- **Fixed:** 6 doc audit findings (F-01, F-07, F-09, F-11, F-12)
- **Clean Knip:** Removed 6 unused types, added `@public SK API` to 2 exported functions

### 🧪 Testing

- **253 unit tests** across 22 files (all passing)
- **48 E2E tests** (all passing)
- Notification service mock tests with proper query order matching
- Removed dead E2E spec (`notifications.spec.ts`)

### 🏗️ DX & Infra

- **Standardized ports:** dev=3000, e2e=3005 (centralized in `package.json`)
- **Pre-commit:** `no-unused-vars` enforced as error
- **Dead code removal:** 3 files + 1 devDep cleaned via Knip
- **Human ID Pattern:** `USR-1001` friendly IDs using PostgreSQL sequences

---

## [2.7.0] - 2026-02-13

> 💎 **Release Candidate Polish + Major Refactors (SK-001 to SK-005)**

### 🚀 Major Features & Refactors

- **SK-001:** Standardized Server Actions with `withAuth` helper (consistent error handling/RBAC)
- **SK-002:** Componentized `StatusToggle` + Soft Delete pattern (integrated in tables/details)
- **SK-003:** Dedicated User Detail Page (Read-only view with "Edit" mode)
- **SK-004:** `SearchInput` component with debounce + URL sync; TableFilter generics
- **SK-005:** Comprehensive CRUD Scaffold Guide (`docs/reference/crud-scaffold.md`)

### 🎨 Design & UX

- **BottomNav:** Extensive improvements to mobile navigation and layout
- **UI Polish:** Consistent look & feel, shadowing, and improved responsiveness
- **Tailwind v4:** Validated usage of `h-auto!` (correct syntax for v4)
- **Neumorphism:** Replaced hardcoded `rgba` shadows with `var(--neo-*)` tokens

### 🐛 Fixed (Pre-Release Polish)

- **Roles:** Standardized role badges and removed hardcoded hex colors
- **Imports:** Fixed inconsistent paths (`@/src/config` -> `@/config`)
- **Server Actions:** Replaced error throws with `redirect('/login')` in read actions
- **Audit:** Fixed soft-delete and toggle actions to properly update `modifiedBy/modifiedAt`

### 🏗️ Maintainability

- **Zod:** De-duplicated validation schemas (UserForm now uses shared schemas)
- **Docs:** Updated `component-catalog`, `features`, and `reusable-library` to match current state

### 🔍 R4 Audit Polish

- **Catch blocks:** Added `console.error` to 13 silent catch blocks across 10 components for debuggability
- **Branding:** Centralized hardcoded hex colors (`#1e40af`, `#0a1628`) into `branding.ts` with env overrides
- **Manifest/Layout:** `manifest.ts` and `layout.tsx` now reference `branding.themeColor`/`branding.backgroundColor`
- **Knip:** Removed 2 redundant `ignoreDependencies` entries; documented 30 SK public API exports as intentional
- **Comments:** Clarified intentional catch blocks (`client.ts`, `helpers.ts`), `lang="es"`, Google brand colors

### 🧪 Unit Test Coverage (9.2% → 31%)

- **7 new test files** (182 tests total, up from 73):
  - `config-branding.test.ts` — branding config values and logo helpers
  - `config-auth-features.test.ts` — OAuth flags, provider validation, credential retrieval
  - `config-status.test.ts` — status design tokens and style lookup
  - `config-roles.test.ts` — role hierarchy, assignable roles, badge styles
  - `config-navigation.test.ts` — nav filtering by role, bottom nav, more sheet
  - `email-templates-extended.test.ts` — 7 remaining email templates (HTML + plain text)
  - `logger.test.ts` — structured logging with context, dev/prod formatting
- **Coverage strategy documented** in `vitest.config.ts` with categorized excludes
- **100% coverage** on: `roles.ts`, `status.ts`, `lib/validations/`, `lib/utils/`, `invites/token.ts`

---

## [2.6.0] - 2026-02-12

> 🚀 **Login UX + CRUD Detail Page Pattern**

### 🆕 Added

- **Password visibility toggle**: Eye/EyeOff button in login password field (`LoginForm.tsx`)
- **Soft-deleted account guard**: Credentials login now rejects `deletedAt` users with `AccountDisabled` error and user-friendly message
- **CRUD Detail Page Pattern**: Users now have a dedicated `/settings/users/[id]` detail page with Avatar, role badge, and info card. Replaces view modal. Table rows are clickable with `onRowClick` navigation.

---

## [2.5.1] - 2026-02-11

> 🐛 **Bug Fixes**

### 🐛 Fixed

- **BottomNav active pill**: Config tab no longer shows active pill when Perfil is selected (prefix collision `/settings` vs `/settings/profile`)
- **createUser role preservation**: OAuth `createUser` event no longer overwrites seeded `super_admin` role with default `user`

### 🏗️ Infra

- **Versioning split**: `package.json` now uses `version` (app, starts at `1.0.0`) + `factoryVersion` (template, currently `2.5.1`)
- **CHANGELOG moved**: Factory changelog relocated to `docs/factory/CHANGELOG.md`; root `CHANGELOG.md` is now a clean template for forked apps
- **Backlog removed from main**: `docs/backlog/` removed from `main` branch (stays in `develop`)

---

## [2.5.0] - 2026-02-10

> 🎨 **Neumorphic Design System — Full UI Migration**

### 🎨 Design System

- **Neumorphic utility classes** (`neo-outset`, `neo-outset-sm`, `neo-outset-lg`, `neo-inset`, `neo-inset-sm`, `neo-pressed`) in `globals.css`
- **CSS custom properties** for neumorphic shadows per theme: `--neo-*` tokens in `light`, `midnight`, `dark`
- **3-theme system fix**: Removed all `dark:` Tailwind prefix usage (only works for `.dark` class, NOT `.midnight`)

### 🔄 Migrated Components (UI Primitives)

- `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`, `Label` — neumorphic shadows + `rounded-xl`
- `Card`, `Dialog`, `Sheet`, `AlertDialog`, `Popover`, `DropdownMenu`, `Tooltip` — `neo-outset` containers
- `Badge`, `Tabs`, `Table`, `Separator`, `ScrollArea` — subtle shadow adaptation
- `Skeleton` — theme-aware pulsing with CSS variables
- `DataTable`, `TableSearch`, `TableFilter`, `TablePagination` — full neumorphic styling
- `SubmitButton` — replaced raw `<button>` with neumorphic hover/active states
- `ConfirmDialog` — variant buttons (`danger`, `warning`, `default`) use shadow-based hovers
- `ShowcaseBanner` — CSS variables for per-theme text/background colors

### 🧹 Exhaustive Audit (11 files fixed)

- `not-found.tsx`, `error.tsx`, `offline/page.tsx` — raw buttons → neumorphic
- `ErrorBoundary.tsx` — container + button → `neo-outset` + neumorphic button
- `EmptyState.tsx` — container → `neo-inset-sm`, button → neumorphic
- `(auth)/error/page.tsx` — card (`bg-card border shadow-xl` → `neo-outset`), links, icon containers
- `RecentUsersTableSkeleton.tsx` — `var(--sidebar-bg)` inline → `neo-outset bg-background`
- `ConfirmDialog.tsx` — `hover:bg-*/90` → shadow-based hovers
- `terms/page.tsx`, `privacy/page.tsx` — `dark:prose-invert` → theme-aware foreground classes
- `(legal)/layout.tsx` — header/footer borders + hover effects

### 📐 Layout Shell

- `Sidebar`, `Header` — neumorphic surfaces with CSS variable integration
- `PageContainer` — neumorphic content wrapper
- All auth pages (`login`, `register`, `forgot-password`, `reset-password`) — neumorphic forms + `rounded-xl`

### 📱 Mobile Navigation (BottomNav)

- **`BottomNav`**: Config-driven fixed bottom navigation bar (`lg:hidden`) with active pill indicator
- **`BottomNavMoreSheet`**: Framer Motion spring sheet with 3-column grid for overflow items
- **Replaces**: `MobileDrawer` (hamburger menu) — deleted
- **Config**: `bottomNav`, `bottomNavOrder`, `bottomNavOnly`, `bottomNavLabel`, `bottomNavHref` in `navigation.ts`
- `bottomNavLabel`: Short label override (max 10 chars) — e.g. "Demo Showcase" → "Demo"
- `bottomNavHref`: Override href for collapsible parents — e.g. `/settings` → `/settings/general`
- **Template guide**: Inline agent documentation + `features.md` section 1.25
- Added `framer-motion` dependency

### 🐛 Fixed

- `dark:prose-invert` silently failing in midnight theme (3-theme conflict)
- `hover:bg-primary-hover` non-existent class across 5 components
- Inline `var(--card-border)` / `var(--sidebar-bg)` bypassing design system
- Legal page borders not theme-aware

### 🔒 Security

- **Registration Gate**: OAuth (Google/GitHub) and Magic Link now respect `NEXT_PUBLIC_AUTH_REGISTRATION=false`
  - `signIn` callback blocks account creation, redirects to `/login?error=RegistrationDisabled`
  - `sendVerificationRequest` silently drops magic links for unregistered users (prevents email enumeration)
  - `LoginForm` displays user-friendly error message via `AUTH_ERROR_MESSAGES` map
  - Magic Link success toast changed to neutral wording (doesn't reveal if email exists)

---

## [2.4.1] - 2026-02-09

> 📚 **Documentation Patch — SK Component Catalog & CRUD Reference**

### 📚 Documentation

- **component-catalog.md:** Catálogo completo de componentes SK con props, imports y ejemplos de uso
- **reference-001-user-crud.md:** Implementación gold standard del CRUD de Users — patrón replicable para futuros CRUDs
- **reusable-library.md:** Sección de Testing Infrastructure añadida (Vitest, Playwright, fixtures, helpers, patrones)

---

## [2.4.0] - 2026-02-09

> 🧹 **Sprint Cleanup & Quality — 9/10 issues completed**

### 🐛 Fixed

- **FIX-001:** `isSuperAdmin()` email comparison bug — function now correctly checks role instead of email string
- **FIX-002:** Auth pages (forgot-password, reset-password, accept-invite) now respect client logos via `branding.getClientLogo()` with proper fallback

### 🧹 Cleanup

- **CLN-001:** Fixed `'superadmin'` typo in navigation config → `'super_admin'`
- **CLN-002:** Added RBAC scaffolding documentation — clarified that `posts` and `comments` in permissions are examples, not real resources
- **CLN-003:** Super admin audit log migrated from in-memory to database-backed via `logAuditEvent()`
- **CLN-004:** Replaced `console.error` with structured `logger` in email test route and invite API
- **CLN-005:** Renamed mock dashboard → Demo page (`/demo`) with `ShowcasePlaceholder` components
- **CLN-006:** Added `CODEBASE.md` auto-generation to pre-commit hooks via `generate-codebase.mjs`

### 🆕 Added

- **UI-002:** `ShowcasePlaceholder` + `ShowcaseBanner` reusable components for feature showcases
- `/demo` page — centralized demo/showcase page
- `/settings/general` page — general settings placeholder
- `docs/reference/CODEBASE.md` — auto-generated dependency map
- `scripts/tools/generate-codebase.mjs` — CODEBASE.md generator script

### 📚 Documentation

- Fixed 3 broken links to deleted `optional-features.md` (content merged into `features.md`)
- Updated `features.md` SSOT with v2.4 routes, components, and audit changes
- Updated `docs/README.md` reference table and backlog milestones
- Updated `getting-started.md` with corrected doc references

### ⏳ Deferred

- **UI-001:** React Bits Liquid Ether background animation (WebGL visibility issue — documented in issue for retry)

---

## [2.3.1] - 2026-02-04

> 🧪 **E2E Neon Branch Isolation**

### Added

#### E2E Testing Infrastructure

- **Neon Branch Isolation:** Each E2E test run creates a temporary database branch
  - `scripts/tools/neon-branch.ts` — API utilities for branch management
  - `scripts/tools/e2e-runner.ts` — Orchestrates: create branch → start server → run tests → cleanup
- **Setup Command:** `pnpm setup:e2e` now configures NEON_API_KEY and NEON_PROJECT_ID
- **Documentation:** `docs/guides/e2e-testing.md` — Complete guide in Spanish

### Changed

- **Drizzle:** Uses HTTP fetch mode in CI (`neonConfig.poolQueryViaFetch`) to avoid WebSocket issues
- **Playwright:** Removed `webServer` config (handled by e2e-runner wrapper)
- **Package.json:**
  - `test:e2e` → Uses wrapper script with branch isolation
  - `test:e2e:direct` → Fallback for debugging without isolation

### Fixed

- **CI WebSocket Issues:** Neon serverless driver now uses fetch in GitHub Actions
- **Endpoint Readiness:** `waitForEndpoint()` polls Neon API until branch is active

---

## [2.3.0] - 2026-02-04

> 🔄 **Starter Kit Sync**

### Changed

- Synchronized with starter-kit upstream
- Applied mobile menu, scrollbar overlay, and PWA migration fixes
- Optimized Husky hooks for pre-commit and pre-push
- Simplified reusable-library.md documentation

---

## [2.2.0] - 2026-02-01

> 🚀 **Full CRUD + Agent Workflows + Quality Gates**

### Highlights

- Complete User Admin CRUD with RBAC
- 25 E2E tests (all passing)
- Agent workflows enhanced with /qc and /proposal
- Lighthouse PWA assertions removed (deprecated in v12+)

---

### 🆕 Features

#### User Admin CRUD (CRUD-002)

- Full CRUD for user management at `/settings/users`
- Role-based access control (ADMIN/SUPER_ADMIN only)
- Inline editing with UserFormDialog
- User invitation system with InviteUserDialog
- Soft delete pattern implementation

#### User Profile (CRUD-001)

- Self-service profile editing at `/settings/profile`
- Name and avatar management
- Secure password change flow

#### Schema Improvements

- **SCHEMA-001:** Audit fields (`createdBy`, `modifiedBy`) on all tables
- **SCHEMA-002:** Soft delete pattern (`deletedAt`, `deletedBy`)
- **SCHEMA-003:** Human ID pattern (UUID + readable ID)

#### Auth Improvements

- **AUTH-001:** Removed auto-register for SuperAdmin (security)
- **SEED-001:** SuperAdmin seed now sets `createdBy` properly

#### Database

- **DB-001:** Migrated to Neon Serverless Driver for better edge compatibility

#### PWA

- **PWA-001:** Install prompt only shown in protected routes

#### UX Improvements

- **UX-020:** Login email memory (remembers last email)
- **UX-021:** Breadcrumb global context
- **UX-023:** LCP fix for logo header
- **UX-025:** Table sorting and pagination improvements

#### Components

- **COMP-001:** Added missing shadcn components
- **COMP-002:** Renamed TableFilters → TableExtras

---

### 🧪 Testing

#### E2E Tests (TEST-004)

- `tests/e2e/user-admin.spec.ts` — 7 test cases
- Create, edit, delete user flows
- Filter by role, search by name/email
- RBAC: USER denied, ADMIN can't create SUPER_ADMIN
- Total: 25 E2E tests passing (22s)

---

### 🏭 Factory Workflows

#### /qc — Post-Implementation Quality Check (NEW)

- 9 mandatory checks before closing issues
- Issue Compliance, Tests, Patterns, Rules, Duplication
- Breaking Changes (🛑 STOP), Migration Check, Scope Creep
- Integrated in `/implement` as Phase 5

#### /proposal — Client Proposal Workflow (NEW)

- Generates client-facing proposal document
- Output: `docs/proposal/PROPOSAL.md`
- Confirmation checkpoints before delivery

#### /audit Improvements

- Agent Enforcement Rules (7 unbreakable rules)
- Verdict Decision Rules table
- Coverage < 80% en R3 = BLOCKER
- Removed PWA assertions (deprecated Lighthouse 12+)

#### /implement Improvements

- Renumbered: Phase 5 = QC, Phase 6 = Closure
- Now calls /qc automatically before closing

#### Domain Skills

- `ui/SKILL.md` — Added SIEMPRE/NUNCA section
- All workflows now have Gates/Escalation section

---

### 📚 Documentation

- **DOCS-020:** CRUD Patterns documented
- **DOCS-021:** Best Practices guide
- **DOCS-022:** Editable Tables UX patterns
- **DOCS-023:** Known Issues documented

---

### 🐛 Fixes

- `.neon` removed from git tracking (local config)
- Lighthouse PWA assertions removed (deprecated v12+)
- `docs.md` trimmed to stay under 12KB
- `implement.md` condensed for size limits

---

## [2.0.0] - 2026-01-29

### 🏭 Factory 2.0 - Skills Architecture

Major refactor of the AI-first development infrastructure. Replaces agent-based architecture with skills-based approach for better modularity and context efficiency.

### Added

#### Skills System (`.gemini/skills/`)

- **Domain Skills:** `api/`, `db/`, `security/`, `testing/`, `ui/` — Domain-specific knowledge and patterns
- **Role Skills:** `discovery/`, `docs/`, `design/`, `backlog/`, `implement/`, `architect/`, `quality-engineer/` — Role-based behaviors with templates

#### Workflows (`.agent/workflows/`)

- `/start` — Session initialization with context loading
- `/discovery` — Product discovery, generates Discovery Brief
- `/docs` — Generate planning docs (01-05)
- `/design` — Generate 06_DESIGN.md with screens, flows, components
- `/backlog` — Create issues from design spec
- `/implement` — Execute issues through 5-phase pipeline
- `/park` — Capture ideas without interrupting flow
- `/audit` — Dynamic quality audit (R0-R3 tiers)
- `/consult-architect` — Technical decisions with ADRs
- `/consult-qe` — Quality review consultation

#### Documentation

- `docs/rules/AI_RULES.md` — SSOT for agent behavior
- `docs/rules/SSOT_HIERARCHY.md` — Document authority chain

### Changed

- Moved legacy agents/prompts to `.github/` for VS Code/Copilot compatibility
- Restructured templates into skill-specific locations
- Updated `copilot-instructions.md` as lightweight pointer to AI_RULES

### Removed

- Old agent files (now in `.github/agents/` as legacy)
- Redundant workflow files (`/bugfix`, `/refactor`, `/verify`, `/pause`, `/resume`)
- Old template structure (consolidated into skills)

### Migration

No breaking changes for existing projects. New workflows are additive.

---

## [1.1.0] — 2026-01-26

> 🚀 **Documentation, DX & Quality Improvements**

### Highlights

- Backlog Visualization: Auto-generated `BOARD.md` Kanban view
- Enhanced `/implement` traceability with detailed Implementation Notes
- Lighthouse CI integrated into `/audit-pre-release` workflow
- Documentation consolidation (removed duplicate QUICKSTART.md)
- SSOT cleanup: Factory owns process, Starter Kit owns product

### New Features

- **Sprint Board (`docs/backlog/BOARD.md`):** Auto-generated from issues via `pnpm update-board`
- **Implementation Notes:** Mandatory "Context & Decisions" section in issue closure
- **Lighthouse Assertions:** Pre-release workflow now validates LCP, CLS, TBT metrics

### Developer Experience

- `scripts/tools/update-board.ts` — CLI tool for board generation
- `lint-staged` hook auto-updates board when issues are modified
- ESLint config updated to allow `console.*` in scripts
- Dependencies updated (zod 4.3.6, vitest 4.0.18, playwright 1.58.0)

### Documentation

- Consolidated QUICKSTART.md into `docs/guides/getting-started.md`
- Fixed SSOT references in `docs/README.md`
- Added documentation link section to main README

### Factory Methodology

- Git Strategy defined (`main` → `dev` → `feat/*` branches)
- Audit workflow standardized (Workflow + Prompt pattern)
- Factory `seed/` cleaned: only process files, no product docs

---

## [1.0.0] — 2026-01-22

> 🎉 **First production-ready release of TimeKast Starter Kit**

### Starter Kit

#### Highlights

- Complete auth system: password, magic link, OAuth (Google/GitHub)
- Super admin auto-provisioning
- Password reset with secure tokens
- PWA support with offline mode
- 3-theme system (Light, Midnight, Dark)
- Logger utility with environment-aware logging
- 17 routes, 12 unit tests, 13 E2E tests

#### Dependencies

- Next.js 16.1.4
- NextAuth.js 5.0.0-beta.30
- Drizzle ORM 0.45.1
- sonner 2.0.7
- lucide-react 0.562.0
- @tailwindcss v4

#### Security

**ISSUE-SK-001:** Fixed password validation bypass en super admin authentication

- **Severidad:** CRITICAL — Complete authentication bypass
- **Archivos:** `lib/auth/super-admin.ts`, `lib/auth/auth.ts`
- **Cambios:**
  - Added `password` parameter to `handleSuperAdminAccess()`
  - Implemented password validation before granting super admin access
  - Updated `SuperAdminUser` type to include password field
  - Added `verifyPassword` function to options
- **Status:** ✅ Fixed

**esbuild vulnerability:** Resolved via pnpm override (>=0.25.0)

#### Sprint 2: Email & Password Reset

- Factory pattern for email providers (Resend, SMTP, none)
- Branded email templates with optional logo
- Test endpoint `/api/email/test` with rate limiting
- Secure token generation (SHA-256 hashed)
- One token per user, 1-hour expiration
- No user enumeration (consistent responses)
- Pre-built UI: `/forgot-password`, `/reset-password`

#### Sprint 3: PWA Features

- Native manifest via Next.js (`src/app/manifest.ts`)
- Service Worker with `next-pwa` (security-first caching)
- Install UX: toast (7-day cooldown) + iOS A2HS hint
- Offline UX: banner + `/offline` fallback page
- Update UX: "Nueva versión" toast with proper SW update flow
- Cache policy: API routes `NetworkOnly` by default
- Documentation: `CACHE_POLICY.md`, `PERFORMANCE.md`

#### Sprint 4: UI Polish & DX Improvements

- Table UI Redesign (Up&Up style layout)
- Logger utility (`lib/logger.ts`)
- Icon migration from `@heroicons/react` to `lucide-react`
- OAuth account linking (Google/GitHub link to existing email)
- Custom auth error page in Spanish
- Typography plugin for legal pages
- ESLint `no-console` rule
- Tailwind spacing tokens (min-w-10, min-h-50)

#### Schema Changes

- `users.isDeleted` (boolean) → `users.deletedAt` (timestamp)
- All timestamps now use `withTimezone: true`

---

## Factory Methodology

### 2026-01-19

**Created comprehensive backlog from test-auth-app learnings:**

- EPIC-SK-001: Starter Kit Critical Fixes (9 issues)
- EPIC-FACTORY-001: Factory Methodology Improvements (3 issues)
- Total: 12 issues documented

**Issues identified:**

- 2 P0 (Critical): Password validation, drizzle.config
- 7 P1 (Important): TypeScript warnings, UX improvements
- 3 P2 (Nice to have): Polish and DX improvements

---

## Previous Work

### 2026-01-18 - 2026-01-19

**Implemented complete auth system (ADR-007):**

- NextAuth.js v5 with credentials, OAuth (Google, GitHub)
- RBAC with 3-tier roles (SUPER_ADMIN, ADMIN, USER)
- Super admin auto-registration and promotion
- Database schema compatible with Drizzle adapter
- Build passes without DATABASE_URL (conditional adapter)

**Documentation centralized:**

- Created `seed/docs/` structure in Factory
- Updated CI/CD to sync docs to starter-kit
- Moved AUTH_SETUP.md to seed/docs (SSOT)

**Testing and validation:**

- Created test-auth-app project
- Found and documented 12 bugs/improvements
- Created LEARNINGS.md and parking-lot.md

---

_Factory changelog — gestión del proyecto y templates_
