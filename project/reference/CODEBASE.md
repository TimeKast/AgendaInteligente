# 🗺️ CODEBASE — Dependency Map

> **Auto-generated** — Run `pnpm generate:codebase` to update
> **Last updated:** 2026-05-20

---

## ⚠️ High-Risk Files

> Files with 2+ dependents — changes here may break multiple consumers.

| File | Dependents |
|------|------------|
| `src\lib\email\templates\layout.ts` | 9 |
| `src\lib\db\schema\users.ts` | 3 |
| `src\lib\email\types.ts` | 3 |
| `src\lib\auth\utils.ts` | 2 |
| `src\lib\db\schema\index.ts` | 2 |
| `src\lib\db\drizzle.ts` | 2 |
| `src\lib\email\logo-data.ts` | 2 |

---

## 📊 Full Dependency Map

| File | Depends On | Used By |
|------|------------|--------|
| `src\app\(agendaInteligente)\layout.tsx` | — | — |
| `src\app\(agendaInteligente)\today\page.tsx` | — | — |
| `src\app\(auth)\accept-invite\page.tsx` | — | — |
| `src\app\(auth)\error\page.tsx` | — | — |
| `src\app\(auth)\forgot-password\page.tsx` | — | — |
| `src\app\(auth)\layout.tsx` | — | — |
| `src\app\(auth)\login\page.tsx` | — | — |
| `src\app\(auth)\register\page.tsx` | — | — |
| `src\app\(auth)\reset-password\page.tsx` | — | — |
| `src\app\(legal)\layout.tsx` | — | — |
| `src\app\(legal)\privacy\page.tsx` | — | — |
| `src\app\(legal)\terms\page.tsx` | — | — |
| `src\app\(protected)\DashboardShell.tsx` | — | `src\app\(protected)\layout.tsx` |
| `src\app\(protected)\dashboard\loading.tsx` | — | — |
| `src\app\(protected)\dashboard\page.tsx` | — | — |
| `src\app\(protected)\layout.tsx` | `src\app\(protected)\DashboardShell.tsx` | — |
| `src\app\(protected)\notifications\notifications-client.tsx` | — | `src\app\(protected)\notifications\page.tsx` |
| `src\app\(protected)\notifications\page.tsx` | `src\app\(protected)\notifications\notifications-client.tsx` | — |
| `src\app\(protected)\profile\loading.tsx` | — | — |
| `src\app\(protected)\profile\page.tsx` | `src\app\(protected)\profile\profile-tabs.tsx` | — |
| `src\app\(protected)\profile\profile-tabs.tsx` | — | `src\app\(protected)\profile\page.tsx` |
| `src\app\(protected)\settings\general\page.tsx` | — | — |
| `src\app\(protected)\settings\users\[id]\loading.tsx` | — | — |
| `src\app\(protected)\settings\users\[id]\page.tsx` | — | — |
| `src\app\(protected)\settings\users\loading.tsx` | — | — |
| `src\app\(protected)\settings\users\nuevo\page.tsx` | — | — |
| `src\app\(protected)\settings\users\page.tsx` | — | — |
| `src\app\api\auth\[...nextauth]\route.ts` | — | — |
| `src\app\api\auth\forgot-password\route.ts` | — | — |
| `src\app\api\auth\register\route.ts` | — | — |
| `src\app\api\auth\reset-password\route.ts` | — | — |
| `src\app\api\avatar\[userId]\route.ts` | — | — |
| `src\app\api\email\test\route.ts` | — | — |
| `src\app\api\health\route.ts` | — | — |
| `src\app\api\invites\accept\route.ts` | — | — |
| `src\app\api\invites\send\route.ts` | — | — |
| `src\app\api\invites\validate\route.ts` | — | — |
| `src\app\api\notifications\poll\route.ts` | — | — |
| `src\app\api\push\subscribe\route.ts` | — | — |
| `src\app\error.tsx` | — | — |
| `src\app\layout.tsx` | `src\app\serwist.ts` | — |
| `src\app\manifest.ts` | — | — |
| `src\app\not-found.tsx` | — | — |
| `src\app\offline\page.tsx` | — | — |
| `src\app\page.tsx` | — | — |
| `src\app\serwist.ts` | — | `src\app\layout.tsx` |
| `src\app\serwist\[path]\route.ts` | — | — |
| `src\app\sw.ts` | — | — |
| `src\components\admin\InviteUserDialog.tsx` | — | `src\components\admin\UserTable.tsx` |
| `src\components\admin\NewUserContent.tsx` | — | — |
| `src\components\admin\UserActivityLog.tsx` | — | — |
| `src\components\admin\UserDataTab.tsx` | — | — |
| `src\components\admin\UserDetailContent.tsx` | — | — |
| `src\components\admin\UserNavigator.tsx` | — | — |
| `src\components\admin\UserTable.tsx` | `src\components\admin\InviteUserDialog.tsx` | — |
| `src\components\agenda\ActivityRow.tsx` | `src\components\agenda\PriorityDots.tsx`, `src\components\agenda\ProjectChip.tsx` | — |
| `src\components\agenda\ActivitySection.tsx` | — | — |
| `src\components\agenda\AgendaBottomNav.tsx` | — | — |
| `src\components\agenda\AgendaHeader.tsx` | — | — |
| `src\components\agenda\DaySheetMorningSection.tsx` | `src\components\agenda\EnergyIndicators.tsx`, `src\components\agenda\SheetField.tsx` | — |
| `src\components\agenda\EnergyIndicators.tsx` | — | `src\components\agenda\DaySheetMorningSection.tsx` |
| `src\components\agenda\FabMic.tsx` | — | — |
| `src\components\agenda\PriorityDots.tsx` | — | `src\components\agenda\ActivityRow.tsx` |
| `src\components\agenda\ProjectChip.tsx` | — | `src\components\agenda\ActivityRow.tsx` |
| `src\components\agenda\SheetField.tsx` | — | `src\components\agenda\DaySheetMorningSection.tsx` |
| `src\components\auth\AcceptInviteForm.tsx` | — | — |
| `src\components\auth\ForgotPasswordForm.tsx` | — | — |
| `src\components\auth\LoginForm.tsx` | — | — |
| `src\components\auth\RegisterForm.tsx` | — | — |
| `src\components\auth\ResetPasswordForm.tsx` | — | — |
| `src\components\auth\index.ts` | — | — |
| `src\components\branding\BrandLogo.tsx` | — | — |
| `src\components\branding\index.ts` | — | — |
| `src\components\common\AlertDialog.tsx` | — | — |
| `src\components\common\BreadcrumbSetter.tsx` | — | — |
| `src\components\common\Dialog.tsx` | — | — |
| `src\components\common\EmptyState.tsx` | — | — |
| `src\components\common\ErrorBoundary.tsx` | — | — |
| `src\components\common\Footer.tsx` | — | — |
| `src\components\common\OfflineBanner.tsx` | — | — |
| `src\components\common\ShowcasePlaceholder.tsx` | — | — |
| `src\components\common\StatusToggle.tsx` | — | — |
| `src\components\common\index.ts` | — | — |
| `src\components\dashboard\ClientDate.tsx` | — | — |
| `src\components\dashboard\TestNotificationCard.tsx` | — | — |
| `src\components\form\Form.tsx` | — | `src\components\form\SubmitButton.tsx` |
| `src\components\form\FormCheckbox.tsx` | — | — |
| `src\components\form\FormField.tsx` | — | — |
| `src\components\form\FormSelect.tsx` | — | — |
| `src\components\form\SubmitButton.tsx` | `src\components\form\Form.tsx` | — |
| `src\components\form\index.ts` | — | — |
| `src\components\layout\BottomNav.tsx` | `src\components\layout\BottomNavMoreSheet.tsx` | — |
| `src\components\layout\BottomNavMoreSheet.tsx` | — | `src\components\layout\BottomNav.tsx` |
| `src\components\layout\Header.tsx` | `src\components\layout\NavigationControls.tsx` | — |
| `src\components\layout\NavigationControls.tsx` | — | `src\components\layout\Header.tsx` |
| `src\components\layout\Sidebar.tsx` | — | — |
| `src\components\notifications\NotificationBell.tsx` | — | `src\components\notifications\NotificationPanel.tsx` |
| `src\components\notifications\NotificationCriticalBanner.tsx` | — | — |
| `src\components\notifications\NotificationDetailDialog.tsx` | — | `src\components\notifications\NotificationPanel.tsx` |
| `src\components\notifications\NotificationItem.tsx` | — | `src\components\notifications\NotificationPanel.tsx` |
| `src\components\notifications\NotificationPanel.tsx` | `src\components\notifications\NotificationBell.tsx`, `src\components\notifications\NotificationDetailDialog.tsx`, `src\components\notifications\NotificationItem.tsx` | — |
| `src\components\notifications\NotificationSettings.tsx` | — | — |
| `src\components\notifications\NotificationStatusBanner.tsx` | — | — |
| `src\components\notifications\PushDevicesList.tsx` | — | — |
| `src\components\notifications\PushPermissionPrompt.tsx` | — | — |
| `src\components\providers\Providers.tsx` | — | — |
| `src\components\providers\ThemeProvider.tsx` | — | — |
| `src\components\pwa\IosA2hsHint.tsx` | — | — |
| `src\components\pwa\PullToRefresh.tsx` | — | — |
| `src\components\pwa\PullToRefreshShell.tsx` | — | — |
| `src\components\pwa\PwaInstallToast.tsx` | — | — |
| `src\components\pwa\PwaUpdateToast.tsx` | — | — |
| `src\components\pwa\index.ts` | — | — |
| `src\components\settings\AvatarUpload.tsx` | — | `src\components\settings\ProfileForm.tsx` |
| `src\components\settings\ChangePasswordForm.tsx` | — | `src\components\settings\ProfileForm.tsx` |
| `src\components\settings\ProfileForm.tsx` | `src\components\settings\ChangePasswordForm.tsx`, `src\components\settings\AvatarUpload.tsx` | — |
| `src\components\ui\alert-dialog.tsx` | — | — |
| `src\components\ui\avatar.tsx` | — | — |
| `src\components\ui\badge.tsx` | — | — |
| `src\components\ui\breadcrumb.tsx` | — | — |
| `src\components\ui\button.tsx` | — | — |
| `src\components\ui\card.tsx` | — | — |
| `src\components\ui\confirm-dialog.tsx` | — | — |
| `src\components\ui\data-table.tsx` | `src\components\ui\table.tsx`, `src\components\ui\table-extras.tsx` | — |
| `src\components\ui\dialog.tsx` | — | — |
| `src\components\ui\dropdown-menu.tsx` | — | — |
| `src\components\ui\input.tsx` | — | — |
| `src\components\ui\neo-checkbox.tsx` | — | — |
| `src\components\ui\pagination.tsx` | — | `src\components\ui\table-extras.tsx` |
| `src\components\ui\popover.tsx` | — | — |
| `src\components\ui\select.tsx` | — | — |
| `src\components\ui\separator.tsx` | — | — |
| `src\components\ui\sheet.tsx` | — | — |
| `src\components\ui\skeleton.tsx` | — | — |
| `src\components\ui\sonner.tsx` | — | — |
| `src\components\ui\switch.tsx` | — | — |
| `src\components\ui\table-extras.tsx` | `src\components\ui\pagination.tsx` | `src\components\ui\data-table.tsx` |
| `src\components\ui\table-filter.tsx` | — | — |
| `src\components\ui\table.tsx` | — | `src\components\ui\data-table.tsx` |
| `src\components\ui\tabs.tsx` | — | — |
| `src\components\ui\tooltip.tsx` | — | — |
| `src\config\app.ts` | — | — |
| `src\config\auth-features.ts` | — | — |
| `src\config\branding.ts` | — | — |
| `src\config\navigation.ts` | — | — |
| `src\config\notifications.ts` | — | — |
| `src\config\roles.ts` | — | — |
| `src\config\status.ts` | — | — |
| `src\lib\actions\admin\user-admin.ts` | — | — |
| `src\lib\actions\audit.ts` | — | — |
| `src\lib\actions\avatar.ts` | — | — |
| `src\lib\actions\change-password.ts` | — | — |
| `src\lib\actions\helpers.ts` | — | — |
| `src\lib\actions\notifications.ts` | — | — |
| `src\lib\actions\profile.ts` | — | — |
| `src\lib\actions\send-reset-email.ts` | — | — |
| `src\lib\actions\types.ts` | — | — |
| `src\lib\api\client.ts` | — | — |
| `src\lib\audit.ts` | — | — |
| `src\lib\auth\auth.config.ts` | — | `src\lib\auth\auth.ts` |
| `src\lib\auth\auth.ts` | `src\lib\auth\utils.ts`, `src\lib\auth\auth.config.ts` | — |
| `src\lib\auth\index.ts` | — | — |
| `src\lib\auth\password-reset.ts` | `src\lib\auth\utils.ts` | — |
| `src\lib\auth\permissions.ts` | — | — |
| `src\lib\auth\super-admin.ts` | — | — |
| `src\lib\auth\utils.ts` | — | `src\lib\auth\auth.ts`, `src\lib\auth\password-reset.ts` |
| `src\lib\cache.ts` | — | — |
| `src\lib\contexts\BreadcrumbContext.tsx` | — | — |
| `src\lib\contexts\UnsavedChangesContext.tsx` | — | — |
| `src\lib\db\drizzle.ts` | `src\lib\db\schema\index.ts` | `src\lib\db\seed.ts`, `src\lib\db\seeds\admin.ts` |
| `src\lib\db\helpers\audit-fields.ts` | — | — |
| `src\lib\db\helpers\can-hard-delete.ts` | — | — |
| `src\lib\db\helpers\soft-delete.ts` | — | — |
| `src\lib\db\queries\users.ts` | — | — |
| `src\lib\db\schema\audit.ts` | `src\lib\db\schema\users.ts` | — |
| `src\lib\db\schema\index.ts` | — | `src\lib\db\drizzle.ts`, `src\lib\db\seeds\admin.ts` |
| `src\lib\db\schema\invites.ts` | `src\lib\db\schema\users.ts` | — |
| `src\lib\db\schema\notifications.ts` | `src\lib\db\schema\users.ts` | — |
| `src\lib\db\schema\rate-limit.ts` | — | — |
| `src\lib\db\schema\users.ts` | — | `src\lib\db\schema\audit.ts`, `src\lib\db\schema\invites.ts`, `src\lib\db\schema\notifications.ts` |
| `src\lib\db\seed.ts` | `src\lib\db\seeds\index.ts`, `src\lib\db\drizzle.ts` | — |
| `src\lib\db\seeds\admin.ts` | `src\lib\db\drizzle.ts`, `src\lib\db\schema\index.ts` | — |
| `src\lib\db\seeds\index.ts` | — | `src\lib\db\seed.ts` |
| `src\lib\db\utils\pagination.ts` | — | — |
| `src\lib\email\index.ts` | `src\lib\email\resend.ts`, `src\lib\email\smtp.ts`, `src\lib\email\types.ts` | — |
| `src\lib\email\logo-data.ts` | — | `src\lib\email\resend.ts`, `src\lib\email\smtp.ts` |
| `src\lib\email\resend.ts` | `src\lib\email\types.ts`, `src\lib\email\logo-data.ts` | `src\lib\email\index.ts` |
| `src\lib\email\smtp.ts` | `src\lib\email\types.ts`, `src\lib\email\logo-data.ts` | `src\lib\email\index.ts` |
| `src\lib\email\templates\invite-accepted.ts` | `src\lib\email\templates\layout.ts` | — |
| `src\lib\email\templates\invite-user.ts` | `src\lib\email\templates\layout.ts` | — |
| `src\lib\email\templates\layout.ts` | — | `src\lib\email\templates\invite-accepted.ts`, `src\lib\email\templates\invite-user.ts`, `src\lib\email\templates\login-alert.ts`, `src\lib\email\templates\magic-link.ts`, `src\lib\email\templates\notification.ts`, `src\lib\email\templates\password-changed.ts`, `src\lib\email\templates\password-reset-confirm.ts`, `src\lib\email\templates\password-reset.ts`, `src\lib\email\templates\verify-email.ts` |
| `src\lib\email\templates\login-alert.ts` | `src\lib\email\templates\layout.ts` | — |
| `src\lib\email\templates\magic-link.ts` | `src\lib\email\templates\layout.ts` | — |
| `src\lib\email\templates\notification.ts` | `src\lib\email\templates\layout.ts` | — |
| `src\lib\email\templates\password-changed.ts` | `src\lib\email\templates\layout.ts` | — |
| `src\lib\email\templates\password-reset-confirm.ts` | `src\lib\email\templates\layout.ts` | — |
| `src\lib\email\templates\password-reset.ts` | `src\lib\email\templates\layout.ts` | — |
| `src\lib\email\templates\verify-email.ts` | `src\lib\email\templates\layout.ts` | — |
| `src\lib\email\types.ts` | — | `src\lib\email\index.ts`, `src\lib\email\resend.ts`, `src\lib\email\smtp.ts` |
| `src\lib\env.ts` | — | — |
| `src\lib\hooks\index.ts` | — | — |
| `src\lib\hooks\useDebounce.ts` | — | — |
| `src\lib\hooks\useDialogViewportFit.ts` | — | — |
| `src\lib\hooks\useMounted.ts` | — | — |
| `src\lib\hooks\useNotifications.ts` | — | — |
| `src\lib\hooks\usePermissions.tsx` | — | — |
| `src\lib\hooks\usePushSubscription.ts` | — | — |
| `src\lib\hooks\useServerTableState.ts` | `src\lib\hooks\useTableState.ts` | — |
| `src\lib\hooks\useTableState.ts` | — | `src\lib\hooks\useServerTableState.ts` |
| `src\lib\hooks\useUnsavedChangesGuard.ts` | — | — |
| `src\lib\invites\index.ts` | `src\lib\invites\token.ts` | — |
| `src\lib\invites\token.ts` | — | `src\lib\invites\index.ts` |
| `src\lib\logger.ts` | — | — |
| `src\lib\notifications\index.ts` | — | — |
| `src\lib\notifications\parse-user-agent.ts` | — | — |
| `src\lib\notifications\push.ts` | — | — |
| `src\lib\notifications\service.ts` | — | — |
| `src\lib\pwa\index.ts` | — | — |
| `src\lib\pwa\shellPullToRefresh.tsx` | — | — |
| `src\lib\pwa\sw-listener.ts` | — | — |
| `src\lib\pwa\usePullToRefresh.ts` | — | — |
| `src\lib\pwa\usePwaInstall.ts` | — | — |
| `src\lib\rate-limit.ts` | — | — |
| `src\lib\utils\cn.ts` | — | — |
| `src\lib\utils\human-id.ts` | — | — |
| `src\lib\utils\platform.ts` | — | — |
| `src\lib\validations\admin\user-admin.ts` | — | — |
| `src\lib\validations\profile.ts` | — | — |

---

## 📈 Summary

| Metric | Value |
|--------|-------|
| Total files analyzed | 228 |
| Total connections | 49 |
| High-risk files (2+ deps) | 7 |
| Orphan files (no connections) | 163 |

---

_Generated by `scripts/tools/generate-codebase.mjs`_
