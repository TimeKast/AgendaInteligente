/**
 * Settings page loaders.
 *
 * Lives in src/lib/db/queries/ (BR-1 allowlist) — needs to read users
 * + accounts which aren't in TENANT_TABLES, plus a couple of count
 * aggregates that don't fit the scopedDb factory.
 */

import { eq, and, isNull, count } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, accounts } from '@/lib/db/schema/users';
import { projects } from '@/lib/db/schema/projects';
import { calendarConnections } from '@/lib/db/schema/calendar-connections';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';

export interface SettingsHubData {
  email: string;
  name: string | null;
  timezone: string;
  preferredLanguage: string;
  intensityMode: string;
  projectsActive: number;
  integrationsConnected: number;
}

export async function loadSettingsHub(userId: string): Promise<SettingsHubData | null> {
  const [userRows, projectCount, calendarCount, prefsRows] = await Promise.all([
    db
      .select({
        email: users.email,
        name: users.name,
        timezone: users.timezone,
        preferredLanguage: users.preferredLanguage,
        intensityMode: users.intensityMode,
      })
      .from(users)
      .where(eq(users.id, userId)),
    db
      .select({ c: count() })
      .from(projects)
      .where(
        and(eq(projects.userId, userId), eq(projects.status, 'active'), isNull(projects.deletedAt))
      ),
    db
      .select({ c: count() })
      .from(calendarConnections)
      .where(and(eq(calendarConnections.userId, userId), eq(calendarConnections.enabled, true))),
    db
      .select({ discordWebhookUrl: notificationPrefs.discordWebhookUrl })
      .from(notificationPrefs)
      .where(eq(notificationPrefs.userId, userId)),
  ]);

  const u = userRows[0];
  if (!u) return null;
  const discordConnected = prefsRows[0]?.discordWebhookUrl ? 1 : 0;
  return {
    email: u.email,
    name: u.name,
    timezone: u.timezone,
    preferredLanguage: u.preferredLanguage,
    intensityMode: u.intensityMode,
    projectsActive: projectCount[0]?.c ?? 0,
    integrationsConnected: (calendarCount[0]?.c ?? 0) + discordConnected,
  };
}

export interface AccountSettingsData {
  email: string;
  name: string | null;
  hasPassword: boolean;
  createdAt: Date | null;
  providers: string[];
}

export async function loadAccountSettings(userId: string): Promise<AccountSettingsData | null> {
  const [userRows, accountRows] = await Promise.all([
    db
      .select({
        email: users.email,
        name: users.name,
        password: users.password,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId)),
    db.select({ provider: accounts.provider }).from(accounts).where(eq(accounts.userId, userId)),
  ]);
  const u = userRows[0];
  if (!u) return null;
  return {
    email: u.email,
    name: u.name,
    hasPassword: !!u.password,
    createdAt: u.createdAt,
    providers: accountRows.map((a) => a.provider),
  };
}
