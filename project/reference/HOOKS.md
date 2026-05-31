# 🪝 HOOKS & HELPERS REGISTRY

> **Auto-generated** — Run `pnpm generate:hooks` to update. Regenerated automatically on pre-commit.
> **Purpose:** Canonical names and import paths for kit-shipped hooks, action wrappers, DB helpers, form kit, and UI wrappers. Skills and code generation MUST grep this file instead of inventing names.
> **Last updated:** 2026-05-31

**Scope:** runtime value exports only (functions, components, consts, classes). Types and interfaces are intentionally excluded — signatures live in the source files.

---

## Hooks

📦 `@/lib/hooks`

| Name | Kind | Import | File |
|------|------|--------|------|
| `Can` | component | `@/lib/hooks` | `src\lib\hooks\usePermissions.tsx` |
| `DEFAULT_PAGE_SIZE` | constant | `src\lib\hooks\useServerTableState` | `src\lib\hooks\useServerTableState.ts` |
| `MAX_PAGE_SIZE` | constant | `src\lib\hooks\useServerTableState` | `src\lib\hooks\useServerTableState.ts` |
| `PAGE_SIZE_OPTIONS` | constant | `src\lib\hooks\useServerTableState` | `src\lib\hooks\useServerTableState.ts` |
| `RequireRole` | component | `@/lib/hooks` | `src\lib\hooks\usePermissions.tsx` |
| `toggleSortDirection` | function | `src\lib\hooks\useTableState` | `src\lib\hooks\useTableState.ts` |
| `useChatStream` | hook | `src\lib\hooks\useChatStream` | `src\lib\hooks\useChatStream.ts` |
| `useDebounce` | hook | `@/lib/hooks` | `src\lib\hooks\useDebounce.ts` |
| `useDialogViewportFit` | hook | `@/lib/hooks` | `src\lib\hooks\useDialogViewportFit.ts` |
| `useMounted` | hook | `src\lib\hooks\useMounted` | `src\lib\hooks\useMounted.ts` |
| `useNotifications` | hook | `src\lib\hooks\useNotifications` | `src\lib\hooks\useNotifications.ts` |
| `usePermissions` | hook | `@/lib/hooks` | `src\lib\hooks\usePermissions.tsx` |
| `usePushSubscription` | hook | `src\lib\hooks\usePushSubscription` | `src\lib\hooks\usePushSubscription.ts` |
| `useServerTableState` | hook | `src\lib\hooks\useServerTableState` | `src\lib\hooks\useServerTableState.ts` |
| `useTableState` | hook | `src\lib\hooks\useTableState` | `src\lib\hooks\useTableState.ts` |
| `useUnsavedChangesGuard` | hook | `src\lib\hooks\useUnsavedChangesGuard` | `src\lib\hooks\useUnsavedChangesGuard.ts` |

---

## Action Helpers

📦 `@/lib/actions/helpers`

| Name | Kind | Import | File |
|------|------|--------|------|
| `withAuth` | async function | `@/lib/actions/helpers` | `src\lib\actions\helpers.ts` |
| `withSelf` | async function | `@/lib/actions/helpers` | `src\lib\actions\helpers.ts` |

---

## DB Helpers

📦 `@/lib/db/helpers`

| Name | Kind | Import | File |
|------|------|--------|------|
| `auditFields` | const | `src\lib\db\helpers\audit-fields` | `src\lib\db\helpers\audit-fields.ts` |
| `canHardDeleteUser` | async function | `src\lib\db\helpers\can-hard-delete` | `src\lib\db\helpers\can-hard-delete.ts` |
| `notDeleted` | function | `src\lib\db\helpers\soft-delete` | `src\lib\db\helpers\soft-delete.ts` |
| `softDeleteFields` | const | `src\lib\db\helpers\soft-delete` | `src\lib\db\helpers\soft-delete.ts` |

---

## DB Utils

📦 `@/lib/db/utils`

| Name | Kind | Import | File |
|------|------|--------|------|
| `buildPaginationSQL` | function | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |
| `CACHE_TTL_BATCH` | constant | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |
| `CACHE_TTL_REALTIME` | constant | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |
| `calculateOffset` | function | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |
| `calculateTotalPages` | function | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |
| `clampPageSize` | function | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |
| `createCachedCount` | function | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |
| `DEFAULT_PAGE_SIZE` | constant | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |
| `MAX_PAGE_SIZE` | constant | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |
| `PAGE_SIZE_OPTIONS` | constant | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |
| `parsePaginationParams` | function | `src\lib\db\utils\pagination` | `src\lib\db\utils\pagination.ts` |

---

## Form Kit

📦 `@/components/form`

| Name | Kind | Import | File |
|------|------|--------|------|
| `Form` | component | `@/components/form` | `src\components\form\index.ts` |
| `FormCheckbox` | component | `@/components/form` | `src\components\form\index.ts` |
| `FormField` | component | `@/components/form` | `src\components\form\index.ts` |
| `FormSelect` | component | `@/components/form` | `src\components\form\index.ts` |
| `FormSwitch` | component | `@/components/form` | `src\components\form\index.ts` |
| `FormTextarea` | component | `@/components/form` | `src\components\form\index.ts` |
| `SubmitButton` | component | `@/components/form` | `src\components\form\index.ts` |
| `useForm` | hook | `@/components/form` | `src\components\form\index.ts` |
| `useFormContext` | hook | `@/components/form` | `src\components\form\index.ts` |

---

## Common Components

📦 `@/components/common`

| Name | Kind | Import | File |
|------|------|--------|------|
| `BreadcrumbSetter` | component | `src\components\common\BreadcrumbSetter` | `src\components\common\BreadcrumbSetter.tsx` |
| `EmptyState` | component | `src\components\common\EmptyState` | `src\components\common\EmptyState.tsx` |
| `ErrorBoundary` | component | `src\components\common\ErrorBoundary` | `src\components\common\ErrorBoundary.tsx` |
| `Footer` | component | `@/components/common` | `src\components\common\Footer.tsx` |
| `OfflineBanner` | component | `src\components\common\OfflineBanner` | `src\components\common\OfflineBanner.tsx` |
| `ShowcasePlaceholder` | component | `src\components\common\ShowcasePlaceholder` | `src\components\common\ShowcasePlaceholder.tsx` |
| `StatusToggle` | component | `src\components\common\StatusToggle` | `src\components\common\StatusToggle.tsx` |

---

## UI Wrappers (kit-shipped)

📦 `@/components/ui`

| Name | Kind | Import | File |
|------|------|--------|------|
| `ConfirmDialog` | component | `@/components/ui/confirm-dialog` | `src\components\ui\confirm-dialog.tsx` |

---

## 📊 Summary

| Category | Count |
|----------|-------|
| Hooks | 16 |
| Action Helpers | 2 |
| DB Helpers | 4 |
| DB Utils | 11 |
| Form Kit | 9 |
| Common Components | 7 |
| UI Wrappers (kit-shipped) | 1 |
| **Total** | **50** |

---

_Generated by `scripts/tools/generate-hooks.mjs` — FX-004_
