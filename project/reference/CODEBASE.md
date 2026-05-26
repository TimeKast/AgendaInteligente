# 🗺️ CODEBASE — Dependency Map

> **Auto-generated** — Run `pnpm generate:codebase` to update
> **Last updated:** 2026-05-26

---

## ⚠️ High-Risk Files

> Files with 2+ dependents — changes here may break multiple consumers.

| File | Dependents |
|------|------------|
| `src\lib\db\schema\users.ts` | 11 |
| `src\lib\email\templates\layout.ts` | 9 |
| `src\components\agenda\ActivityRow.tsx` | 6 |
| `src\components\agenda\DraggablePoolActivity.tsx` | 4 |
| `src\components\agenda\PlanSnapshotControls.tsx` | 4 |
| `src\components\agenda\ActivityQuickAdd.tsx` | 4 |
| `src\lib\db\drizzle.ts` | 4 |
| `src\components\agenda\PriorityDots.tsx` | 3 |
| `src\lib\email\types.ts` | 3 |
| `src\lib\inngest\client.ts` | 3 |
| `src\components\agenda\RecurrencePicker.tsx` | 2 |
| `src\components\agenda\DeadlineBadge.tsx` | 2 |
| `src\components\agenda\ColorPicker.tsx` | 2 |
| `src\components\agenda\IconPicker.tsx` | 2 |
| `src\components\agenda\CalendarGrid.tsx` | 2 |
| `src\components\agenda\MonthDayCell.tsx` | 2 |
| `src\components\agenda\WeekPoolSection.tsx` | 2 |
| `src\components\agenda\QuickAddDayPopover.tsx` | 2 |
| `src\components\agenda\PlanSnapshotViewer.tsx` | 2 |
| `src\components\agenda\StatusBadge.tsx` | 2 |
| `src\lib\auth\utils.ts` | 2 |
| `src\lib\db\schema\index.ts` | 2 |
| `src\lib\db\schema\projects.ts` | 2 |
| `src\lib\db\schema\categories.ts` | 2 |
| `src\lib\db\schema\activities.ts` | 2 |
| `src\lib\db\schema\billing.ts` | 2 |
| `src\lib\email\logo-data.ts` | 2 |

---

## 📊 Full Dependency Map

| File | Depends On | Used By |
|------|------------|--------|
| `src\app\(agendaInteligente)\activity\[id]\page.tsx` | — | — |
| `src\app\(agendaInteligente)\categories\[id]\page.tsx` | — | — |
| `src\app\(agendaInteligente)\categories\page.tsx` | — | — |
| `src\app\(agendaInteligente)\chat\crisis-demo\page.tsx` | — | — |
| `src\app\(agendaInteligente)\chat\page.tsx` | — | — |
| `src\app\(agendaInteligente)\goals\[id]\page.tsx` | — | — |
| `src\app\(agendaInteligente)\goals\page.tsx` | — | — |
| `src\app\(agendaInteligente)\layout.tsx` | — | — |
| `src\app\(agendaInteligente)\month\page.tsx` | — | — |
| `src\app\(agendaInteligente)\onboarding\calendar\page.tsx` | — | — |
| `src\app\(agendaInteligente)\onboarding\context\page.tsx` | — | — |
| `src\app\(agendaInteligente)\onboarding\done\page.tsx` | — | — |
| `src\app\(agendaInteligente)\onboarding\language\page.tsx` | — | — |
| `src\app\(agendaInteligente)\onboarding\mic\page.tsx` | — | — |
| `src\app\(agendaInteligente)\onboarding\push\page.tsx` | — | — |
| `src\app\(agendaInteligente)\onboarding\schedule\page.tsx` | — | — |
| `src\app\(agendaInteligente)\onboarding\timezone\page.tsx` | — | — |
| `src\app\(agendaInteligente)\projects\[id]\page.tsx` | — | — |
| `src\app\(agendaInteligente)\projects\page.tsx` | — | — |
| `src\app\(agendaInteligente)\settings\account\page.tsx` | — | — |
| `src\app\(agendaInteligente)\settings\appearance\page.tsx` | — | — |
| `src\app\(agendaInteligente)\settings\billing\page.tsx` | — | — |
| `src\app\(agendaInteligente)\settings\integrations\page.tsx` | — | — |
| `src\app\(agendaInteligente)\settings\intensity\page.tsx` | — | — |
| `src\app\(agendaInteligente)\settings\language\page.tsx` | — | — |
| `src\app\(agendaInteligente)\settings\notifications\page.tsx` | — | — |
| `src\app\(agendaInteligente)\settings\page.tsx` | — | — |
| `src\app\(agendaInteligente)\settings\privacy\page.tsx` | — | — |
| `src\app\(agendaInteligente)\stats\page.tsx` | — | — |
| `src\app\(agendaInteligente)\tasks\page.tsx` | — | — |
| `src\app\(agendaInteligente)\today\page.tsx` | — | — |
| `src\app\(agendaInteligente)\week\page.tsx` | — | — |
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
| `src\app\api\auth\verify\route.ts` | — | — |
| `src\app\api\avatar\[userId]\route.ts` | — | — |
| `src\app\api\email\test\route.ts` | — | — |
| `src\app\api\health\route.ts` | — | — |
| `src\app\api\inngest\route.ts` | — | — |
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
| `src\components\agenda\AccountDeletionModal.tsx` | — | — |
| `src\components\agenda\ActivityQuickAdd.tsx` | `src\components\agenda\PriorityDots.tsx`, `src\components\agenda\RecurrencePicker.tsx` | `src\components\agenda\MonthPlanner.tsx`, `src\components\agenda\TodayActivitiesBoard.tsx`, `src\components\agenda\WeekPoolSection.tsx`, `src\components\agenda\WeekSwimlane.tsx` |
| `src\components\agenda\ActivityRow.tsx` | `src\components\agenda\DeadlineBadge.tsx`, `src\components\agenda\RecurrencePicker.tsx` | `src\components\agenda\DraggableTaskRow.tsx`, `src\components\agenda\LinkedActivitiesList.tsx`, `src\components\agenda\ProjectActivityRow.tsx`, `src\components\agenda\SortableActivityRow.tsx`, `src\components\agenda\SortableActivityRow.tsx`, `src\components\agenda\TodayActivitiesBoard.tsx` |
| `src\components\agenda\ActivitySection.tsx` | — | — |
| `src\components\agenda\ActivityStatusModal.tsx` | — | `src\components\agenda\TodayActivitiesBoard.tsx` |
| `src\components\agenda\AgendaBottomNav.tsx` | — | `src\components\agenda\AgendaShell.tsx` |
| `src\components\agenda\AgendaHeader.tsx` | — | — |
| `src\components\agenda\AgendaShell.tsx` | `src\components\agenda\AgendaBottomNav.tsx`, `src\components\agenda\FabMic.tsx` | — |
| `src\components\agenda\AgentMessage.tsx` | — | — |
| `src\components\agenda\AppearanceController.tsx` | — | — |
| `src\components\agenda\BarChart.tsx` | — | — |
| `src\components\agenda\CalendarConnectionsList.tsx` | — | — |
| `src\components\agenda\CalendarGrid.tsx` | `src\components\agenda\HourSlot.tsx` | `src\components\agenda\DraggableTaskRow.tsx`, `src\components\agenda\TodayActivitiesBoard.tsx` |
| `src\components\agenda\CategoryRow.tsx` | `src\components\agenda\ColorPicker.tsx`, `src\components\agenda\IconPicker.tsx` | — |
| `src\components\agenda\ChallengeIndicator.tsx` | — | — |
| `src\components\agenda\ChatInput.tsx` | — | — |
| `src\components\agenda\CloseDayModal.tsx` | — | — |
| `src\components\agenda\ColorPicker.tsx` | — | `src\components\agenda\CategoryRow.tsx`, `src\components\agenda\NewCategoryModal.tsx` |
| `src\components\agenda\ConfirmDeleteModal.tsx` | — | `src\components\agenda\PlanSnapshotControls.tsx` |
| `src\components\agenda\Conversation.tsx` | — | — |
| `src\components\agenda\CrisisExitPanel.tsx` | — | — |
| `src\components\agenda\DateDivider.tsx` | — | — |
| `src\components\agenda\DayActivitiesSheet.tsx` | — | `src\components\agenda\MonthPlanner.tsx` |
| `src\components\agenda\DayCard.tsx` | — | — |
| `src\components\agenda\DayOffChip.tsx` | — | `src\components\agenda\DaysOffPicker.tsx` |
| `src\components\agenda\DayRow.tsx` | `src\components\agenda\DraggablePoolActivity.tsx`, `src\components\agenda\PlanSnapshotControls.tsx` | `src\components\agenda\WeekSwimlane.tsx` |
| `src\components\agenda\DaySheetMorningSection.tsx` | — | — |
| `src\components\agenda\DaysOffPicker.tsx` | `src\components\agenda\DayOffChip.tsx` | — |
| `src\components\agenda\DeadlineBadge.tsx` | — | `src\components\agenda\ActivityRow.tsx`, `src\components\agenda\DraggablePoolActivity.tsx` |
| `src\components\agenda\DiscordIntegrationCard.tsx` | — | — |
| `src\components\agenda\DraggablePoolActivity.tsx` | `src\components\agenda\DeadlineBadge.tsx` | `src\components\agenda\DayRow.tsx`, `src\components\agenda\MonthPlanner.tsx`, `src\components\agenda\WeekPoolSection.tsx`, `src\components\agenda\WeekSwimlane.tsx` |
| `src\components\agenda\DraggableTaskRow.tsx` | `src\components\agenda\ActivityRow.tsx`, `src\components\agenda\CalendarGrid.tsx` | `src\components\agenda\TodayActivitiesBoard.tsx` |
| `src\components\agenda\ExternalEventRow.tsx` | — | `src\components\agenda\TodayActivitiesBoard.tsx` |
| `src\components\agenda\FabMic.tsx` | `src\components\agenda\VoiceCaptureSheet.tsx` | `src\components\agenda\AgendaShell.tsx` |
| `src\components\agenda\FilterChips.tsx` | — | — |
| `src\components\agenda\GoalCard.tsx` | `src\components\agenda\ScopeChip.tsx` | — |
| `src\components\agenda\GoalReviewModal.tsx` | — | — |
| `src\components\agenda\GoalsTabs.tsx` | — | — |
| `src\components\agenda\HourSlot.tsx` | — | `src\components\agenda\CalendarGrid.tsx` |
| `src\components\agenda\IconPicker.tsx` | — | `src\components\agenda\CategoryRow.tsx`, `src\components\agenda\NewCategoryModal.tsx` |
| `src\components\agenda\IntegrationCard.tsx` | — | — |
| `src\components\agenda\IntensityCard.tsx` | — | — |
| `src\components\agenda\LinkedActivitiesList.tsx` | `src\components\agenda\ActivityRow.tsx` | — |
| `src\components\agenda\LinkedProjectsList.tsx` | — | — |
| `src\components\agenda\MonthDayCell.tsx` | — | `src\components\agenda\MonthGrid.tsx`, `src\components\agenda\MonthPlanner.tsx` |
| `src\components\agenda\MonthGrid.tsx` | `src\components\agenda\MonthDayCell.tsx` | `src\components\agenda\MonthPlanner.tsx` |
| `src\components\agenda\MonthNavigation.tsx` | — | — |
| `src\components\agenda\MonthPlanner.tsx` | `src\components\agenda\ActivityQuickAdd.tsx`, `src\components\agenda\WeekPoolSection.tsx`, `src\components\agenda\MonthGrid.tsx`, `src\components\agenda\DayActivitiesSheet.tsx`, `src\components\agenda\DraggablePoolActivity.tsx`, `src\components\agenda\MonthDayCell.tsx`, `src\components\agenda\QuickAddDayPopover.tsx`, `src\components\agenda\PlanSnapshotControls.tsx`, `src\components\agenda\PlanSnapshotViewer.tsx` | — |
| `src\components\agenda\MultiDayPicker.tsx` | — | `src\components\agenda\WeekSwimlane.tsx` |
| `src\components\agenda\MutePickerModal.tsx` | — | — |
| `src\components\agenda\NewCategoryModal.tsx` | `src\components\agenda\ColorPicker.tsx`, `src\components\agenda\IconPicker.tsx` | — |
| `src\components\agenda\NewProjectModal.tsx` | `src\components\agenda\StatusBadge.tsx` | — |
| `src\components\agenda\OnboardingLayout.tsx` | `src\components\agenda\OnboardingProgress.tsx` | — |
| `src\components\agenda\OnboardingProgress.tsx` | — | `src\components\agenda\OnboardingLayout.tsx` |
| `src\components\agenda\OnboardingRadioCard.tsx` | — | — |
| `src\components\agenda\PatternsList.tsx` | — | — |
| `src\components\agenda\PlanCard.tsx` | — | — |
| `src\components\agenda\PlanSnapshotControls.tsx` | `src\components\agenda\ConfirmDeleteModal.tsx` | `src\components\agenda\DayRow.tsx`, `src\components\agenda\MonthPlanner.tsx`, `src\components\agenda\PlanSnapshotViewer.tsx`, `src\components\agenda\WeekSwimlane.tsx` |
| `src\components\agenda\PlanSnapshotViewer.tsx` | `src\components\agenda\PlanSnapshotControls.tsx` | `src\components\agenda\MonthPlanner.tsx`, `src\components\agenda\WeekSwimlane.tsx` |
| `src\components\agenda\PoolSection.tsx` | — | `src\components\agenda\TodayActivitiesBoard.tsx` |
| `src\components\agenda\PriorityDots.tsx` | — | `src\components\agenda\ActivityQuickAdd.tsx`, `src\components\agenda\ProjectActivityRow.tsx`, `src\components\agenda\VoicePreviewCard.tsx` |
| `src\components\agenda\ProfileHeader.tsx` | — | — |
| `src\components\agenda\ProgressBar.tsx` | — | — |
| `src\components\agenda\ProjectActivityRow.tsx` | `src\components\agenda\PriorityDots.tsx`, `src\components\agenda\ActivityRow.tsx` | — |
| `src\components\agenda\ProjectChip.tsx` | — | — |
| `src\components\agenda\ProjectRow.tsx` | `src\components\agenda\StatusBadge.tsx` | — |
| `src\components\agenda\ProjectsRanking.tsx` | — | — |
| `src\components\agenda\PushPermissionBanner.tsx` | — | — |
| `src\components\agenda\QuickAddDayPopover.tsx` | — | `src\components\agenda\MonthPlanner.tsx`, `src\components\agenda\WeekSwimlane.tsx` |
| `src\components\agenda\RecurrencePicker.tsx` | — | `src\components\agenda\ActivityQuickAdd.tsx`, `src\components\agenda\ActivityRow.tsx` |
| `src\components\agenda\ScopeChip.tsx` | — | `src\components\agenda\GoalCard.tsx` |
| `src\components\agenda\SettingRow.tsx` | — | — |
| `src\components\agenda\SettingsSection.tsx` | — | — |
| `src\components\agenda\SheetField.tsx` | — | `src\components\agenda\WeekSheetKickoffSection.tsx` |
| `src\components\agenda\SortDropdown.tsx` | — | — |
| `src\components\agenda\SortableActivityRow.tsx` | `src\components\agenda\ActivityRow.tsx`, `src\components\agenda\ActivityRow.tsx` | — |
| `src\components\agenda\StatCard.tsx` | — | — |
| `src\components\agenda\StatusBadge.tsx` | — | `src\components\agenda\NewProjectModal.tsx`, `src\components\agenda\ProjectRow.tsx` |
| `src\components\agenda\SubtaskRow.tsx` | — | — |
| `src\components\agenda\SwipeableRow.tsx` | — | `src\components\agenda\TodayActivitiesBoard.tsx` |
| `src\components\agenda\TagChip.tsx` | — | — |
| `src\components\agenda\TodayActivitiesBoard.tsx` | `src\components\agenda\ActivityRow.tsx`, `src\components\agenda\ActivityQuickAdd.tsx`, `src\components\agenda\SwipeableRow.tsx`, `src\components\agenda\DraggableTaskRow.tsx`, `src\components\agenda\PoolSection.tsx`, `src\components\agenda\CalendarGrid.tsx`, `src\components\agenda\ExternalEventRow.tsx`, `src\components\agenda\ActivityStatusModal.tsx`, `src\components\agenda\TodayViewToggle.tsx` | — |
| `src\components\agenda\TodayViewToggle.tsx` | — | `src\components\agenda\TodayActivitiesBoard.tsx` |
| `src\components\agenda\Toggle.tsx` | — | — |
| `src\components\agenda\UsageMeter.tsx` | — | — |
| `src\components\agenda\UserMessage.tsx` | — | — |
| `src\components\agenda\VerifyEmailBanner.tsx` | — | — |
| `src\components\agenda\VoiceCaptureSheet.tsx` | `src\components\agenda\WaveformAnim.tsx`, `src\components\agenda\VoicePreviewCard.tsx` | `src\components\agenda\FabMic.tsx` |
| `src\components\agenda\VoicePreviewCard.tsx` | `src\components\agenda\PriorityDots.tsx` | `src\components\agenda\VoiceCaptureSheet.tsx` |
| `src\components\agenda\WaveformAnim.tsx` | — | `src\components\agenda\VoiceCaptureSheet.tsx` |
| `src\components\agenda\WeekDayDots.tsx` | — | — |
| `src\components\agenda\WeekDayStrip.tsx` | — | `src\components\agenda\WeekSwimlane.tsx` |
| `src\components\agenda\WeekMonthTabs.tsx` | — | — |
| `src\components\agenda\WeekNavigation.tsx` | — | — |
| `src\components\agenda\WeekPoolSection.tsx` | `src\components\agenda\ActivityQuickAdd.tsx`, `src\components\agenda\DraggablePoolActivity.tsx` | `src\components\agenda\MonthPlanner.tsx`, `src\components\agenda\WeekSwimlane.tsx` |
| `src\components\agenda\WeekSheetKickoffSection.tsx` | `src\components\agenda\SheetField.tsx` | — |
| `src\components\agenda\WeekSwimlane.tsx` | `src\components\agenda\ActivityQuickAdd.tsx`, `src\components\agenda\WeekPoolSection.tsx`, `src\components\agenda\DayRow.tsx`, `src\components\agenda\WeekDayStrip.tsx`, `src\components\agenda\DraggablePoolActivity.tsx`, `src\components\agenda\MultiDayPicker.tsx`, `src\components\agenda\QuickAddDayPopover.tsx`, `src\components\agenda\PlanSnapshotControls.tsx`, `src\components\agenda\PlanSnapshotViewer.tsx` | — |
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
| `src\lib\actions\activity.ts` | — | — |
| `src\lib\actions\admin\user-admin.ts` | — | — |
| `src\lib\actions\audit.ts` | — | — |
| `src\lib\actions\avatar.ts` | — | — |
| `src\lib\actions\category.ts` | — | — |
| `src\lib\actions\change-password.ts` | — | — |
| `src\lib\actions\day-sheet.ts` | — | — |
| `src\lib\actions\helpers.ts` | — | — |
| `src\lib\actions\notifications.ts` | — | — |
| `src\lib\actions\onboarding.ts` | — | — |
| `src\lib\actions\profile.ts` | — | — |
| `src\lib\actions\project.ts` | — | — |
| `src\lib\actions\send-reset-email.ts` | — | — |
| `src\lib\actions\subtask.ts` | — | — |
| `src\lib\actions\types.ts` | — | — |
| `src\lib\api\client.ts` | — | — |
| `src\lib\audit.ts` | — | — |
| `src\lib\auth\auth.config.ts` | — | `src\lib\auth\auth.ts` |
| `src\lib\auth\auth.ts` | `src\lib\auth\utils.ts`, `src\lib\auth\auth.config.ts` | `src\lib\auth\helpers.ts` |
| `src\lib\auth\email-verification.ts` | — | — |
| `src\lib\auth\helpers.ts` | `src\lib\auth\auth.ts` | — |
| `src\lib\auth\index.ts` | — | — |
| `src\lib\auth\password-reset.ts` | `src\lib\auth\utils.ts` | — |
| `src\lib\auth\permissions.ts` | — | — |
| `src\lib\auth\super-admin.ts` | — | — |
| `src\lib\auth\utils.ts` | — | `src\lib\auth\auth.ts`, `src\lib\auth\password-reset.ts` |
| `src\lib\auth\weak-passwords.ts` | — | — |
| `src\lib\cache.ts` | — | — |
| `src\lib\contexts\BreadcrumbContext.tsx` | — | — |
| `src\lib\contexts\UnsavedChangesContext.tsx` | — | — |
| `src\lib\cron\recurrence.ts` | — | — |
| `src\lib\db\drizzle.ts` | `src\lib\db\schema\index.ts` | `src\lib\db\scoped.ts`, `src\lib\db\seed.ts`, `src\lib\db\seeds\admin.ts`, `src\lib\db\seeds\plans.ts` |
| `src\lib\db\helpers\audit-fields.ts` | — | — |
| `src\lib\db\helpers\can-hard-delete.ts` | — | — |
| `src\lib\db\helpers\soft-delete.ts` | — | — |
| `src\lib\db\queries\sheets.ts` | — | — |
| `src\lib\db\queries\users.ts` | — | — |
| `src\lib\db\schema\activities.ts` | `src\lib\db\schema\users.ts`, `src\lib\db\schema\projects.ts` | `src\lib\db\schema\subtasks.ts`, `src\lib\db\scoped.ts` |
| `src\lib\db\schema\audit.ts` | `src\lib\db\schema\users.ts` | — |
| `src\lib\db\schema\billing.ts` | `src\lib\db\schema\users.ts` | `src\lib\db\scoped.ts`, `src\lib\db\seeds\plans.ts` |
| `src\lib\db\schema\categories.ts` | `src\lib\db\schema\users.ts` | `src\lib\db\schema\projects.ts`, `src\lib\db\scoped.ts` |
| `src\lib\db\schema\day-sheets.ts` | `src\lib\db\schema\users.ts` | `src\lib\db\scoped.ts` |
| `src\lib\db\schema\email-verifications.ts` | `src\lib\db\schema\users.ts` | — |
| `src\lib\db\schema\index.ts` | — | `src\lib\db\drizzle.ts`, `src\lib\db\seeds\admin.ts` |
| `src\lib\db\schema\invites.ts` | `src\lib\db\schema\users.ts` | — |
| `src\lib\db\schema\notification-prefs.ts` | `src\lib\db\schema\users.ts` | `src\lib\db\scoped.ts` |
| `src\lib\db\schema\notifications.ts` | `src\lib\db\schema\users.ts` | — |
| `src\lib\db\schema\projects.ts` | `src\lib\db\schema\users.ts`, `src\lib\db\schema\categories.ts` | `src\lib\db\schema\activities.ts`, `src\lib\db\scoped.ts` |
| `src\lib\db\schema\rate-limit.ts` | — | — |
| `src\lib\db\schema\subtasks.ts` | `src\lib\db\schema\activities.ts` | — |
| `src\lib\db\schema\users.ts` | — | `src\lib\db\schema\activities.ts`, `src\lib\db\schema\audit.ts`, `src\lib\db\schema\billing.ts`, `src\lib\db\schema\categories.ts`, `src\lib\db\schema\day-sheets.ts`, `src\lib\db\schema\email-verifications.ts`, `src\lib\db\schema\invites.ts`, `src\lib\db\schema\notification-prefs.ts`, `src\lib\db\schema\notifications.ts`, `src\lib\db\schema\projects.ts`, `src\lib\db\schema\week-sheets.ts` |
| `src\lib\db\schema\week-sheets.ts` | `src\lib\db\schema\users.ts` | `src\lib\db\scoped.ts` |
| `src\lib\db\scoped.ts` | `src\lib\db\drizzle.ts`, `src\lib\db\schema\notification-prefs.ts`, `src\lib\db\schema\billing.ts`, `src\lib\db\schema\categories.ts`, `src\lib\db\schema\projects.ts`, `src\lib\db\schema\activities.ts`, `src\lib\db\schema\day-sheets.ts`, `src\lib\db\schema\week-sheets.ts` | — |
| `src\lib\db\seed.ts` | `src\lib\db\seeds\index.ts`, `src\lib\db\drizzle.ts` | — |
| `src\lib\db\seeds\admin.ts` | `src\lib\db\drizzle.ts`, `src\lib\db\schema\index.ts` | — |
| `src\lib\db\seeds\index.ts` | — | `src\lib\db\seed.ts` |
| `src\lib\db\seeds\plans.ts` | `src\lib\db\drizzle.ts`, `src\lib\db\schema\billing.ts` | — |
| `src\lib\db\utils\pagination.ts` | — | — |
| `src\lib\domain\activity-transitions.ts` | — | — |
| `src\lib\domain\day-sheet-completion.ts` | — | — |
| `src\lib\domain\recurrence.ts` | — | — |
| `src\lib\domain\week-calc.ts` | — | — |
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
| `src\lib\inngest\client.ts` | — | `src\lib\inngest\functions\recurrence-materialize.ts`, `src\lib\inngest\functions\user-signed-up.ts`, `src\lib\inngest\publish.ts` |
| `src\lib\inngest\events.ts` | — | `src\lib\inngest\publish.ts` |
| `src\lib\inngest\functions\index.ts` | `src\lib\inngest\functions\user-signed-up.ts`, `src\lib\inngest\functions\recurrence-materialize.ts` | — |
| `src\lib\inngest\functions\recurrence-materialize.ts` | `src\lib\inngest\client.ts` | `src\lib\inngest\functions\index.ts` |
| `src\lib\inngest\functions\user-signed-up.ts` | `src\lib\inngest\client.ts` | `src\lib\inngest\functions\index.ts` |
| `src\lib\inngest\publish.ts` | `src\lib\inngest\client.ts`, `src\lib\inngest\events.ts` | — |
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
| `src\lib\validations\activity.ts` | — | — |
| `src\lib\validations\admin\user-admin.ts` | — | — |
| `src\lib\validations\category.ts` | — | — |
| `src\lib\validations\day-sheet.ts` | — | — |
| `src\lib\validations\onboarding.ts` | — | — |
| `src\lib\validations\profile.ts` | — | — |
| `src\lib\validations\project.ts` | — | — |
| `src\lib\validations\subtask.ts` | — | — |
| `src\middleware.ts` | — | — |

---

## 📈 Summary

| Metric | Value |
|--------|-------|
| Total files analyzed | 386 |
| Total connections | 136 |
| High-risk files (2+ deps) | 27 |
| Orphan files (no connections) | 257 |

---

_Generated by `scripts/tools/generate-codebase.mjs`_
