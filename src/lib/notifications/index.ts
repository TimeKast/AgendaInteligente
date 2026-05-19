/**
 * Notification System — Public API
 *
 * Barrel export for the notification service.
 * Import from here in application code.
 *
 * @example
 * ```ts
 * import { notify, notifyMany } from '@/lib/notifications';
 *
 * await notify({
 *   userId: 'uuid',
 *   title: 'Hello',
 *   body: 'World',
 *   type: 'info',
 *   category: 'general',
 * });
 * ```
 *
 * @see NOTIF-003
 * @see NOTIF-006
 */

export { notify, notifyMany } from './service';
export type { NotifyInput, NotifyManyInput, NotifyResult } from './service';

export { sendPush, subscribePush, unsubscribePush } from './push';
export type { SendPushInput } from './push';
