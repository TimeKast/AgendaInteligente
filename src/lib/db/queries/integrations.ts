/**
 * Settings/integrations loader.
 *
 * Pulls calendar connections + the user's Discord webhook URL into
 * a single payload for the /settings/integrations page. Both lookups
 * are explicit-userId scoped (ESLint allowlist for `src/lib/db/queries`
 * applies — the BR-1 enforcer ignores this directory).
 */

import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { calendarConnections } from '@/lib/db/schema/calendar-connections';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';

export interface IntegrationCalendarRow {
  id: string;
  accountLabel: string;
  lastSyncLabel: string;
}

export interface IntegrationsSettings {
  googleConnections: IntegrationCalendarRow[];
  microsoftConnections: IntegrationCalendarRow[];
  discordWebhookUrl: string | null;
}

function formatLastSync(lastSyncedAt: Date | null): string {
  if (!lastSyncedAt) return 'Sin sincronizar todavía';
  const minutes = Math.round((Date.now() - lastSyncedAt.getTime()) / 60_000);
  if (minutes < 1) return 'Última sync: hace menos de un minuto';
  if (minutes < 60) return `Última sync: hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Última sync: hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `Última sync: hace ${days} día${days === 1 ? '' : 's'}`;
}

export async function loadIntegrationsSettings(userId: string): Promise<IntegrationsSettings> {
  const [connections, prefs] = await Promise.all([
    db
      .select({
        id: calendarConnections.id,
        provider: calendarConnections.provider,
        accountLabel: calendarConnections.accountLabel,
        externalAccountId: calendarConnections.externalAccountId,
        lastSyncedAt: calendarConnections.lastSyncedAt,
      })
      .from(calendarConnections)
      .where(and(eq(calendarConnections.userId, userId), eq(calendarConnections.enabled, true))),
    db
      .select({ discordWebhookUrl: notificationPrefs.discordWebhookUrl })
      .from(notificationPrefs)
      .where(eq(notificationPrefs.userId, userId)),
  ]);

  const toRow = (c: (typeof connections)[number]): IntegrationCalendarRow => ({
    id: c.id,
    accountLabel: c.accountLabel ?? c.externalAccountId,
    lastSyncLabel: formatLastSync(c.lastSyncedAt),
  });

  return {
    googleConnections: connections.filter((c) => c.provider === 'google').map(toRow),
    microsoftConnections: connections.filter((c) => c.provider === 'outlook').map(toRow),
    discordWebhookUrl: prefs[0]?.discordWebhookUrl ?? null,
  };
}
