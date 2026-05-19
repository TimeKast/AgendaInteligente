# FEATURES.md — Single Source of Truth (SSOT)

> **⚠️ This is the ONLY feature reference for this project.**
> Maintained as a living document — see audit footer for latest version.
> AI agents MUST read this document before implementing ANY feature.

---

## Table of Contents

- [1. Core Features](#1-core-features-always-active)
- [2. Optional Features](#2-optional-features-env-configured)
- [3. Database Schema](#3-database-schema)
- [4. Server Actions](#4-server-actions)
- [5. API Routes](#5-api-routes)
- [6. Email System](#6-email-system)
- [7. Page Routes](#7-page-routes)
- [8. Custom Hooks](#8-custom-hooks)
- [9. Config System](#9-config-system)
- [10. Environment Variables](#10-environment-variables)
- [11. Anti-Patterns (DO NOT)](#11-anti-patterns-do-not)
- [12. Factory Tooling (Developer-Facing)](#12-factory-tooling-developer-facing)

---

## 1. Core Features (Always Active)

### 1.1 Environment Validation

| Property    | Value                                 |
| ----------- | ------------------------------------- |
| **File**    | `src/lib/env.ts` (369 lines)          |
| **Schema**  | Zod-based, 40+ variables              |
| **Loading** | Lazy, cached via `getEnv()`           |
| **Legacy**  | `env` Proxy export (backwards compat) |

- Validates at first access (not import)
- Boolean transformer: `"true"`, `"1"`, `"yes"` → `true`
- `EMAIL_FROM` validates plain email + RFC 5322 format
- Helpers: `isDatabaseConfigured()`, `isEmailConfigured()`, `isGoogleOAuthConfigured()`, `isGitHubOAuthConfigured()`, `getEmailProvider()`, `getSmtpConfig()`, `getResendConfig()`
- Smart defaults: password=true, registration=true, passwordReset=true
- Fallback: if no auth method → auto-enables password + registration

### 1.2 Authentication (NextAuth.js v5)

| Property     | Value                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Files**    | `src/lib/auth/auth.ts` (503 lines), `src/lib/auth/utils.ts`, `src/lib/auth/password-reset.ts`, `src/lib/auth/super-admin.ts` |
| **Config**   | `src/config/auth-features.ts` (lazy Proxy)                                                                                   |
| **Session**  | JWT, 30-day max age                                                                                                          |
| **Password** | bcrypt (12 rounds) via `bcryptjs`                                                                                            |
| **Adapter**  | Drizzle (conditional on `DATABASE_URL`)                                                                                      |

**Providers**: Credentials, Magic Link, Google OAuth, GitHub OAuth (all conditional via `authFeatures`)

**Features**: unique cookies per project, OAuth profile sync (Google Workspace fallback), JWT callback with fresh DB image, audit events (`login_success`, `account_created`), custom pages (`/login`, `/error`), debug mode

### 1.3 Password Reset Flow

| Property     | Value                                        |
| ------------ | -------------------------------------------- |
| **File**     | `src/lib/auth/password-reset.ts` (205 lines) |
| **Token**    | SHA-256 hashed, 1 hour expiry                |
| **Security** | Anti-enumeration, one token per user         |

Functions: `generateResetToken()`, `hashToken()`, `requestPasswordReset()`, `validateResetToken()`, `resetPassword()`

### 1.4 RBAC (Role-Based Access Control)

| Property      | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| **Files**     | `src/lib/auth/permissions.ts` (265 lines), `src/config/roles.ts` |
| **Roles**     | `super_admin` > `admin` > `user`                                 |
| **Resources** | `users`, `posts`_, `comments`_, `settings`                       |
| **Actions**   | `create`, `read`, `update`, `delete`, `list`                     |

> \*`posts` and `comments` are **scaffolding examples** — they demonstrate the RBAC pattern but have no DB schema, server actions, or pages. Use them as a template when adding new resources. |

**ROLE_CONFIG** (SSOT for all role metadata):

`ROLE_CONFIG` in `src/config/roles.ts` is the single source of truth for each role's:

- `displayName` — human-readable label for UI
- `canInvite` — whether the role can send invitations
- `assignableRoles` — which roles this role can assign to others
- `style` — UI design tokens (badge, dot, text classes)

To add a new role, add it to `ROLES`, `ROLE_HIERARCHY`, and `ROLE_CONFIG`. To add a new capability, extend the `RoleConfig` interface and add a helper function.

Functions: `hasPermission()`, `requirePermission()`, `hasMinimumRole()`, `getUserAccessibleResources()`, `getUserActionsForResource()`, `getPermissionSummary()`

Role utils: `getRoleLevel()`, `hasRoleOrHigher()`, `isValidRole()`, `getDefaultRole()`, `isSuperAdmin()`, `getRoleDisplayName()`, `getAssignableRoles()`, `canInvite()`

### 1.5 Super Admin System

| Property      | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| **File**      | `src/lib/auth/super-admin.ts` (129 lines)                               |
| **Bootstrap** | `pnpm db:seed`                                                          |
| **Audit**     | Database-backed via `logAuditEvent()`, extension point for Slack alerts |

Functions: `isUserSuperAdmin()`, `logSuperAdminAction()`, `getRecentSuperAdminActions()`, `alertSuperAdminUsage()`

### 1.6 Invite System

| Property      | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| **Files**     | `src/lib/invites/index.ts` (194 lines), `src/lib/invites/token.ts` |
| **Schema**    | `invite_tokens` table (hashed, 7-day expiry, single-use)           |
| **Templates** | `invite-user` + `invite-accepted` emails                           |

Functions: `createInviteToken()`, `validateInviteToken()`, `markInviteAsAccepted()`, `getInviteByEmail()`

**Role assignment**: Invites carry a target role in `metadata.role` (JSONB). Set during send via `ROLE_CONFIG.assignableRoles` validation. Applied during accept with fallback to `getDefaultRole()`.

### 1.7 API Client

| Property    | Value                                     |
| ----------- | ----------------------------------------- |
| **File**    | `src/lib/api/client.ts` (172 lines)       |
| **Class**   | `ApiClient` + factory `createApiClient()` |
| **Default** | `api` singleton                           |

Type-safe fetch: JSON serialization, generics (`ApiResponse<T>`), interceptors, `get/post/put/patch/delete`, structured errors

### 1.8 Theming System

3 themes (`light`, `dark`, `midnight`), CSS custom properties, `localStorage` via `next-themes`, components: `ThemeToggle`, `ThemeSelector`

> ⚠️ **3-theme constraint**: Tailwind's `dark:` variant only activates for `.dark` class, NOT `.midnight`. Use CSS custom properties or design token classes instead of `dark:` prefix.

### 1.9 Form Kit

`src/components/form/`: `Form`, `FormField`, `FormSelect` (Radix Select + Controller), `FormTextarea`, `FormCheckbox`, `FormSwitch`, `SubmitButton`. Zod validation, server action integration.

For CRUD/create-edit pages with manual navigation buttons, use `useUnsavedChangesGuard` to prevent accidental data loss.

### 1.10 Table Kit

`Table`, `TableSearch`, `TableToolbar`, `TablePagination`. Hooks: `useTableState` (client), `useServerTableState` (server/URL sync)

### 1.11 Breadcrumb Context

`BreadcrumbProvider` (in `src/lib/contexts/`), `Breadcrumb`, `BreadcrumbSetter`. UUID → name replacement via context.

### 1.12 UI Component Library

**shadcn/ui + Radix UI**: `Avatar`, `Badge`, `Button`, `Calendar`, `Card`, `Checkbox`, `ConfirmDialog`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `NeoCheckbox`, `Popover`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Skeleton`, `Sonner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`, `Toaster`, `Tooltip`

**Button variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `neo`, `link`. Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`

**Common**: `OfflineBanner`, `ShowcasePlaceholder`, `EmptyState`, `ErrorBoundary`

**Notifications**: `NotificationBell`, `NotificationPanel`, `NotificationSettings`, `NotificationItem`, `NotificationDetailDialog`

### 1.13 Structured Logger

| Property   | Value                                           |
| ---------- | ----------------------------------------------- |
| **File**   | `src/lib/logger.ts` (114 lines)                 |
| **Dev**    | Pretty print with correlation ID                |
| **Prod**   | JSON for log aggregators                        |
| **Levels** | `debug`, `info` (dev), `warn`, `error` (always) |

### 1.14 Middleware (Correlation ID)

`middleware.ts` (39 lines) — generates/propagates `x-correlation-id`. Does NOT perform auth route protection.

### 1.15 Soft Delete System

`src/lib/db/helpers/soft-delete.ts` — `softDeleteFields` (columns), `notDeleted(table)` (query helper). Application-level only.

### 1.16 Audit Fields Helper

`src/lib/db/helpers/audit-fields.ts` — `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy` columns.

### 1.17 Audit System

| Property     | Value                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**     | `src/lib/audit.ts` (112 lines)                                                                                                                             |
| **Function** | `logAuditEvent()` — fire-and-forget, skips if no DB                                                                                                        |
| **Events**   | `login_success`, `login_failure`, `logout`, `password_changed`, `password_reset`, `account_created`, `account_deleted`, `role_changed`, `settings_changed` |

### 1.18 Navigation System

`src/config/navigation.ts` — sidebar + BottomNav items, `filterNavigationByRole()` for Sidebar, `getBottomNavItems()` for BottomNav (max 4 tabs), `getMoreSheetItems()` for overflow sheet. See `docs/reference/navigation.md`.

### 1.19 Branding System

`src/config/branding.ts` — `appName`, `appTagline`, logos (theme-aware), overridable via `NEXT_PUBLIC_*` env vars.

### 1.20 PWA Support

`src/lib/pwa/`: service worker, install prompt (`usePwaInstall`), offline fallback. Components: `PwaInstallToast`, `PwaUpdateToast`, `IosA2hsHint`.

### 1.21 Health Check Endpoint

`GET /api/health` — returns status (ok/degraded/error), DB connectivity, version, uptime. Returns 503 on degraded.

### 1.22 Seed System

`src/lib/db/seed.ts` + `src/lib/db/seeds/admin.ts`. Command: `pnpm db:seed`. Creates super_admin from env vars.

### 1.23 Neumorphic Design System

| Property      | Value                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| **File**      | `globals.css` — CSS custom properties + utility classes                                                |
| **Utilities** | `neo-outset`, `neo-outset-sm`, `neo-outset-lg`, `neo-inset`, `neo-inset-sm`, `neo-pressed`             |
| **Tokens**    | `--neo-outset`, `--neo-outset-sm`, `--neo-outset-lg`, `--neo-inset`, `--neo-inset-sm`, `--neo-pressed` |
| **Per theme** | `light`, `midnight`, `dark` — each defines unique shadow values                                        |

**Interaction pattern**: `neo-outset-sm` (rest) → `hover:shadow-(--neo-outset)` → `active:shadow-(--neo-pressed)`

**Container pattern**: Cards/dialogs use `neo-outset bg-background rounded-xl`, empty states use `neo-inset-sm`

> ⚠️ **Anti-pattern**: Do NOT use `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `border` for card containers, or `hover:bg-primary-hover` / `hover:bg-*/90` for buttons. Use neumorphic utility classes consistently.

### 1.24 Legal Pages

`/privacy`, `/terms` — content via `NEXT_PUBLIC_COMPANY_NAME`, `NEXT_PUBLIC_COUNTRY`, `NEXT_PUBLIC_LEGAL_EMAIL`

### 1.25 Mobile BottomNav

Config-driven bottom navigation bar for mobile (`< lg` breakpoint). Replaces the hamburger menu pattern.

| Property       | Value                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **Components** | `BottomNav.tsx`, `BottomNavMoreSheet.tsx`                                                           |
| **Config**     | `navigation.ts` — `bottomNav`, `bottomNavOrder`, `bottomNavOnly`, `bottomNavLabel`, `bottomNavHref` |
| **Visibility** | `lg:hidden` — only visible on mobile/tablet                                                         |
| **Dependency** | `framer-motion` (spring animation for "Más" sheet)                                                  |

**NavItem BottomNav properties**:

| Property         | Type      | Description                                                         |
| ---------------- | --------- | ------------------------------------------------------------------- |
| `bottomNav`      | `boolean` | Show item as primary tab in BottomNav                               |
| `bottomNavOrder` | `number`  | Left-to-right position (lower = leftmost)                           |
| `bottomNavOnly`  | `boolean` | Only in BottomNav, hidden from Sidebar                              |
| `bottomNavLabel` | `string`  | Short label for BottomNav (⚠️ max 10 chars). Falls back to `name`   |
| `bottomNavHref`  | `string`  | Override href in BottomNav (e.g. `/settings` → `/settings/general`) |

**How it works**:

- Reads `navigation[]` items with `bottomNav: true`, sorted by `bottomNavOrder`
- Maximum 4 primary tabs + auto "Más" (More) button
- "Más" opens a `framer-motion` sheet from bottom with 3-column grid of remaining items
- Items with `roles` are auto-filtered by user role (same RBAC as Sidebar)
- Items with `bottomNavOnly: true` appear only in BottomNav (hidden from Sidebar)
- Active tab: label uses `text-primary`, icon pill uses `bg-primary text-primary-foreground`

**Customization guide (for AI agents porting to new apps)**:

1. In `navigation.ts`, set `bottomNav: true` on items you want as primary tabs
2. Set `bottomNavOrder` to control left-to-right position (lower = leftmost)
3. Use `bottomNavLabel` for short labels (⚠️ max 10 chars recommended)
4. Use `bottomNavHref` for collapsible parents that need a different target URL
5. Remove items marked `// TEMPLATE:` (e.g., Demo Showcase)
6. Add your app's core routes as `bottomNav: true` items
7. Max 4 items — overflow goes to "Más" sheet automatically

> ⚠️ Items marked `// TEMPLATE: Remove in production apps` are template-only and must be stripped when porting.

### 1.26 Notification System

| Property         | Value                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| **Service**      | `src/lib/notifications/service.ts` (328 lines) — `notify()`, `notifyMany()`, channel dispatch, FIFO cleanup |
| **Config**       | `src/config/notifications.ts` (209 lines) — categories, types, channels                                     |
| **Schema**       | `src/lib/db/schema/notifications.ts` — 3 tables                                                             |
| **Actions**      | `src/lib/actions/notifications.ts` (391 lines) — 8 server actions                                           |
| **Hooks**        | `useNotifications` (SSE orchestrator), `usePushSubscription` (Push API lifecycle), `useSSE` (EventSource)   |
| **Components**   | `NotificationBell`, `NotificationPanel`, `NotificationSettings`, `NotificationItem`                         |
| **Channels**     | `in_app` (always), `push` (VAPID/web-push), `email` (Resend/SMTP)                                           |
| **Real-time**    | SSE via `/api/notifications/stream` — `count` + `notification` events                                       |
| **Feature flag** | `NEXT_PUBLIC_NOTIFICATIONS_ENABLED` — disables entire system when `false`                                   |

**Categories** (extensible per project):

| Category   | Locked | Default Channels  | Description                    |
| ---------- | ------ | ----------------- | ------------------------------ |
| `system`   | ✅     | `in_app`          | Maintenance, updates           |
| `security` | ✅     | `in_app`, `email` | Login alerts, password changes |
| `general`  | ❌     | `in_app`          | General notifications          |

**Types**: `info`, `success`, `warning`, `error`, `system` — mapped to UI variants (color, icon)

**Retention**: 30-day auto-cleanup + 200 max per user (FIFO)

**How it works**:

1. `notify()` resolves effective channels (requested ∩ user preferences)
2. Inserts notification record in DB
3. Dispatches to push/email channels (graceful degradation)
4. SSE stream pushes real-time update to connected client
5. `useNotifications` hook receives SSE event, updates UI state optimistically

### 1.27 Unsaved Changes Guard

| Property     | Value                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| **Context**  | `src/lib/contexts/UnsavedChangesContext.tsx`                                                                |
| **Hook**     | `src/lib/hooks/useUnsavedChangesGuard.ts`                                                                   |
| **Provider** | Mounted globally in `src/components/providers/Providers.tsx`                                                |
| **Dialog**   | `ConfirmDialog` (default/primary variant) for internal navigation                                           |
| **Coverage** | Internal links/buttons (modal), tab close/refresh (`beforeunload`), browser back/forward (`window.confirm`) |

**Pattern**:

1. Register form dirty state: `useUnsavedChangesGuard({ isDirty, disabled })`
2. Guard manual navigation buttons: `confirmNavigation(() => router.push('/target'))`
3. Bypass guard only after successful save: `allowNavigation(() => router.push(...) | router.refresh())`

**Current integrations**: `NewUserContent`, `UserDataTab`, `ProfileForm`

---

## 2. Optional Features (Env-Configured)

### 2.1 Google OAuth

`AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` + `NEXT_PUBLIC_AUTH_GOOGLE="true"`. Redirect: `{APP_URL}/api/auth/callback/google`

### 2.2 GitHub OAuth

`AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` + `NEXT_PUBLIC_AUTH_GITHUB="true"`. Redirect: `{APP_URL}/api/auth/callback/github`

### 2.3 Email Service

`EMAIL_PROVIDER` = `"resend"` | `"smtp"` | `"none"`. Resend: `RESEND_API_KEY`. SMTP: `EMAIL_SERVER_HOST`, `PORT`, `USER`, `PASSWORD`, `SECURE`

### 2.4 Rate Limiting

Dev: in-memory. Prod: `UPSTASH_REDIS_REST_URL` + `TOKEN`. Limits: forgotPassword (5/60s), resetPassword (10/60s), auth (10/60s)

### 2.5 Sentry

`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

### 2.6 E2E Neon Branching

`NEON_API_KEY` + `NEON_PROJECT_ID`. Setup: `pnpm setup:e2e`

### 2.7 Auth Feature Flags

| Flag                              | Default | Description                 |
| --------------------------------- | ------- | --------------------------- |
| `NEXT_PUBLIC_AUTH_PASSWORD`       | `true`  | Password login              |
| `NEXT_PUBLIC_AUTH_MAGIC_LINK`     | `false` | Magic link (requires email) |
| `NEXT_PUBLIC_AUTH_REGISTRATION`   | `true`  | Allow registrations         |
| `NEXT_PUBLIC_AUTH_PASSWORD_RESET` | `true`  | Password reset flow         |
| `NEXT_PUBLIC_AUTH_EMAIL_VERIFY`   | `false` | Email verification          |
| `NEXT_PUBLIC_AUTH_LOGIN_ALERT`    | `false` | Login notifications         |

---

## 3. Database Schema

**ORM**: Drizzle + PostgreSQL (Neon) | **Schemas**: `src/lib/db/schema/`

| Table                      | File                      | Purpose                                                  |
| -------------------------- | ------------------------- | -------------------------------------------------------- |
| `users`                    | `schema/users.ts`         | Core users (soft delete + audit fields)                  |
| `accounts`                 | `schema/users.ts`         | NextAuth OAuth (composite PK)                            |
| `sessions`                 | `schema/users.ts`         | NextAuth sessions                                        |
| `verification_tokens`      | `schema/users.ts`         | Email verification / magic link                          |
| `password_reset_tokens`    | `schema/users.ts`         | Password reset (SHA-256)                                 |
| `audit_logs`               | `schema/audit.ts`         | Security audit trail                                     |
| `invite_tokens`            | `schema/invites.ts`       | Invitation system (JSONB metadata)                       |
| `notifications`            | `schema/notifications.ts` | User notifications (type, category, read, URL, metadata) |
| `push_subscriptions`       | `schema/notifications.ts` | Web Push VAPID subscriptions per device                  |
| `notification_preferences` | `schema/notifications.ts` | Per-user channel × category preferences                  |

---

## 4. Server Actions

| Action                   | File                                  | RBAC           | Description                 |
| ------------------------ | ------------------------------------- | -------------- | --------------------------- |
| `updateProfile`          | `src/lib/actions/profile.ts`          | —              | Update name                 |
| `changePassword`         | `src/lib/actions/change-password.ts`  | —              | Change password             |
| `sendPasswordResetEmail` | `src/lib/actions/send-reset-email.ts` | —              | Trigger reset               |
| `getUsers`               | `src/lib/actions/admin/user-admin.ts` | `users.list`   | List active users           |
| `getUserById`            | `src/lib/actions/admin/user-admin.ts` | `users.read`   | Get user by ID              |
| `createUser`             | `src/lib/actions/admin/user-admin.ts` | `users.create` | Create user                 |
| `updateUser`             | `src/lib/actions/admin/user-admin.ts` | `users.update` | Update user                 |
| `deleteUser`             | `src/lib/actions/admin/user-admin.ts` | `users.delete` | Soft delete                 |
| `restoreUser`            | `src/lib/actions/admin/user-admin.ts` | `users.update` | Restore soft delete         |
| `getNotifications`       | `src/lib/actions/notifications.ts`    | self           | Paginated list with filters |
| `getUnreadCount`         | `src/lib/actions/notifications.ts`    | self           | Unread count for badge      |
| `markAsRead`             | `src/lib/actions/notifications.ts`    | self           | Mark single as read         |
| `markAllAsRead`          | `src/lib/actions/notifications.ts`    | self           | Mark all as read            |
| `markManyAsRead`         | `src/lib/actions/notifications.ts`    | self           | Bulk mark as read           |
| `deleteNotification`     | `src/lib/actions/notifications.ts`    | self           | Delete single notification  |
| `getNotificationPrefs`   | `src/lib/actions/notifications.ts`    | self           | Get preference matrix       |
| `updateNotificationPref` | `src/lib/actions/notifications.ts`    | self           | Toggle channel × category   |

**Helpers**: `src/lib/actions/helpers.ts` — `withAuth()` (admin CRUD), `withSelf()` (self-service)

**Validations**: `src/lib/validations/profile.ts`, `src/lib/validations/admin/user-admin.ts`

---

## 5. API Routes

| Route                       | Method       | Auth              | Purpose                                   |
| --------------------------- | ------------ | ----------------- | ----------------------------------------- |
| `/api/auth/[...nextauth]`   | GET, POST    | —                 | NextAuth.js handler                       |
| `/api/auth/forgot-password` | POST         | —                 | Request password reset                    |
| `/api/auth/reset-password`  | GET, POST    | —                 | Validate / reset password                 |
| `/api/health`               | GET          | —                 | Health check (status, DB, uptime)         |
| `/api/email/test`           | POST         | super_admin / dev | Test email config                         |
| `/api/invites/send`         | POST         | canInvite role    | Send invite email (optional `role` param) |
| `/api/invites/accept`       | POST         | —                 | Accept invite token                       |
| `/api/invites/validate`     | GET          | —                 | Validate invite token                     |
| `/api/notifications/stream` | GET          | Session           | SSE real-time notification stream         |
| `/api/push/subscribe`       | POST, DELETE | Session           | Manage push subscriptions                 |

---

## 6. Email System

**Files**: `src/lib/email/` | **9 Templates** (HTML + plain text):

| Template               | Used By            |
| ---------------------- | ------------------ |
| Magic Link             | Auth sign-in       |
| Password Reset         | Forgot password    |
| Password Reset Confirm | After reset        |
| Password Changed       | Security alert     |
| Verify Email           | Email verification |
| Login Alert            | Security alert     |
| Invite User            | Invitation         |
| Invite Accepted        | Invitation         |
| Layout                 | Shared wrapper     |

---

## 7. Page Routes

| Route              | Group       | Purpose           |
| ------------------ | ----------- | ----------------- |
| `/`                | —           | Landing           |
| `/login`           | (auth)      | Sign in           |
| `/register`        | (auth)      | Sign up           |
| `/forgot-password` | (auth)      | Request reset     |
| `/reset-password`  | (auth)      | Reset with token  |
| `/accept-invite`   | (auth)      | Accept invitation |
| `/error`           | (auth)      | Auth error        |
| `/dashboard`       | (protected) | Dashboard         |

| `/settings/profile` | (protected) | User profile (→ `/profile`) |
| `/settings/users` | (protected) | User mgmt (admin) |
| `/settings/general` | (protected) | General settings (admin) |
| `/privacy` | (legal) | Privacy policy |
| `/terms` | (legal) | Terms |
| `/notifications` | (protected) | Notification center |
| `/offline` | — | PWA offline |

---

## 8. Custom Hooks

| Hook                     | File                                      | Purpose                                   |
| ------------------------ | ----------------------------------------- | ----------------------------------------- |
| `usePermissions`         | `src/lib/hooks/usePermissions.tsx`        | RBAC (`can`, `hasRole`, `isSuperAdmin`)   |
| `useDebounce`            | `src/lib/hooks/useDebounce.ts`            | Debounced value (configurable delay)      |
| `useMounted`             | `src/lib/hooks/useMounted.ts`             | SSR safety                                |
| `useServerTableState`    | `src/lib/hooks/useServerTableState.ts`    | Server table (URL sync)                   |
| `useTableState`          | `src/lib/hooks/useTableState.ts`          | Client table                              |
| `usePwaInstall`          | `src/lib/pwa/usePwaInstall.ts`            | PWA install                               |
| `useNotifications`       | `src/lib/hooks/useNotifications.ts`       | Notification orchestrator (SSE + CRUD)    |
| `usePushSubscription`    | `src/lib/hooks/usePushSubscription.ts`    | Push API subscribe/unsubscribe            |
| `useSSE`                 | `src/lib/hooks/useSSE.ts`                 | Generic SSE EventSource wrapper           |
| `useUnsavedChangesGuard` | `src/lib/hooks/useUnsavedChangesGuard.ts` | Form navigation guard for unsaved changes |

Components: `<Can resource="x" action="y">`, `<RequireRole role="admin">`

---

## 9. Config System

| Config        | File                          | Purpose                                 |
| ------------- | ----------------------------- | --------------------------------------- |
| Roles         | `src/config/roles.ts`         | 3 roles, hierarchy                      |
| Auth Features | `src/config/auth-features.ts` | Feature flags (lazy Proxy)              |
| Branding      | `src/config/branding.ts`      | App name, logos                         |
| Navigation    | `src/config/navigation.ts`    | Sidebar + BottomNav + role filtering    |
| Notifications | `src/config/notifications.ts` | Categories, types, channels, retention  |
| Status        | `src/config/status.ts`        | Entity status styling (active/inactive) |

---

## 10. Environment Variables

Full reference: `.env.example` (179 lines)

**Required**: `DATABASE_URL`, `AUTH_SECRET`

**Application**: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_COMPANY_NAME`, `NEXT_PUBLIC_COUNTRY`, `NEXT_PUBLIC_LEGAL_EMAIL`, `NEXT_PUBLIC_PRIVACY_EMAIL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_CLIENT_LOGO_LIGHT`, `NEXT_PUBLIC_CLIENT_LOGO_DARK`, `AUTH_TRUST_HOST`

**Super Admin Seed**: `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME`

**Notifications**: `NEXT_PUBLIC_NOTIFICATIONS_ENABLED`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (server-only), `VAPID_SUBJECT` (server-only)

---

## 11. Anti-Patterns (DO NOT)

> **🔴 AI agents MUST NOT do any of the following:**

### ❌ Do Not Re-create Existing Systems

| System           | Location                            | Use Instead                                    |
| ---------------- | ----------------------------------- | ---------------------------------------------- |
| Auth             | `src/lib/auth/`                     | `auth()`, `signIn()`, `signOut()`              |
| Password hashing | `src/lib/auth/utils.ts`             | `hashPassword()`, `verifyPassword()`           |
| Permissions      | `src/lib/auth/permissions.ts`       | `hasPermission()`, `requirePermission()`       |
| Roles            | `src/config/roles.ts`               | `hasRoleOrHigher()`, `isSuperAdmin()`          |
| Env              | `src/lib/env.ts`                    | `getEnv()`, never `process.env`                |
| Email            | `src/lib/email/`                    | `sendEmail()`                                  |
| API              | `src/lib/api/client.ts`             | `api.get()`, `api.post()`                      |
| Rate limit       | `src/lib/rate-limit.ts`             | `checkRateLimit()`                             |
| Invites          | `src/lib/invites/`                  | `createInviteToken()`, `validateInviteToken()` |
| Audit            | `src/lib/audit.ts`                  | `logAuditEvent()`                              |
| Logger           | `src/lib/logger.ts`                 | `logger.info()`, never `console.log()`         |
| Soft delete      | `src/lib/db/helpers/soft-delete.ts` | `notDeleted()`, `softDeleteFields`             |
| Branding         | `src/config/branding.ts`            | `branding.*`                                   |
| Navigation       | `src/config/navigation.ts`          | Append to `navigation[]`                       |
| Notifications    | `src/lib/notifications/service.ts`  | `notify()`, `notifyMany()`                     |

### ❌ Do Not Bypass

- Always `requirePermission()` in server actions
- Always `getEnv()` / `getAuthFeatures()`, never raw `process.env`
- Always soft delete (`deletedAt` + `deletedBy`)
- Always `logAuditEvent()` for security events
- Always use `ROLES` constants from `src/config/roles.ts`
- Always `sendEmail()` from `src/lib/email/`
- Always `logger` from `src/lib/logger.ts`

### ✅ How to Extend

| Task               | Approach                                                                   |
| ------------------ | -------------------------------------------------------------------------- |
| New role           | Add to `ROLES` + `ROLE_HIERARCHY` + `ROLE_CONFIG` in `src/config/roles.ts` |
| New capability     | Extend `RoleConfig` interface + add to each role in `ROLE_CONFIG`          |
| New resource       | `Resource` type + `PERMISSIONS` in `src/lib/auth/permissions.ts`           |
| New auth provider  | `AuthProvider` in `auth-features.ts` + `auth.ts`                           |
| New nav item       | Append to `navigation[]` in `navigation.ts`                                |
| New email template | Create in `src/lib/email/templates/`, re-export from `index.ts`            |
| New server action  | `src/lib/actions/`, use `withAuth()` or `withSelf()` helpers               |
| New DB table       | `src/lib/db/schema/`, include soft-delete + audit fields                   |
| New hook           | `src/lib/hooks/`, export from `hooks/index.ts`                             |
| New env var        | `envSchema` in `src/lib/env.ts` + `.env.example`                           |
| New API route      | `src/app/api/`, update this doc §5                                         |

---

## 12. Factory Tooling (Developer-Facing)

> Herramientas del kit para mantener el propio kit. No son features runtime de la app — viven en `scripts/tools/*` y se invocan desde `package.json`.

### 12.1 `pnpm skill:lint` — Skill Validator

Valida `.claude/skills/*/SKILL.md` contra el estado real del repo. Detecta drift antes de que contamine output del agente.

| Property           | Value                                                      |
| ------------------ | ---------------------------------------------------------- |
| Script             | `pnpm skill:lint` / `pnpm skill:lint --json` / `--help`    |
| Entry point        | `scripts/tools/skill-lint/index.ts`                        |
| Checks (P1 error)  | `cross-refs`, `packages`, `symbols`, `rule-contradictions` |
| Checks (P2 warn)   | `anti-enumeration`, `staleness` (>90 días `last-verified`) |
| Exit codes         | `0` clean · `1` errors · `2` usage                         |
| Performance target | <3s sobre el corpus completo (actual: ~200ms en 39 skills) |

**Cuándo correr:** tras editar cualquier skill, o antes de abrir un PR que toca `.claude/skills/`. No está wired a husky en v1 — se corre manual hasta validar zero false positives en el corpus.

**Qué detecta:**

- Referencias a skills inexistentes (`sk-tokens` cuando el real es `sk-tokens-neomorphism`)
- Imports de paquetes no declarados en `package.json` (dentro de code blocks)
- Hooks/wrappers mencionados que no existen en `HOOKS.md` ni en `src/`
- Números que contradicen rules SSOT (ej: "4-layer pyramid" vs SK.md §4.2 "3-layer")
- Enumeraciones de >8 símbolos sin anchor a `INVENTORY.md`/`HOOKS.md`/`CODEBASE.md`
- Skills sin `last-verified` o con fecha >90 días

**Añadir un check nuevo:** crear archivo en `scripts/tools/skill-lint/checks/` que exporte un `Check`, y registrarlo en el array `CHECKS` de `index.ts`. Tests en `tests/unit/skill-lint.test.ts`.

---

> **📝 Audit**: 2026-04-22 | v4.1 | Updated: added §12 Factory Tooling for `pnpm skill:lint` (FX-001)
