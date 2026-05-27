/**
 * Refresh-aware token reader — ISSUE-090b.
 *
 * `getValidAccessToken(userId, connectionId)` is the single read-path for
 * downstream Calendar API callers (sync workers, busy-slot pollers). It:
 *   1. Loads the connection via `scopedDb('calendarConnections')`
 *      (multi-tenant safety: foreign connection id → 404).
 *   2. If `expires_at - now > 60s`, decrypts + returns the current
 *      access_token immediately.
 *   3. Otherwise calls Google `refreshAccessToken` with the decrypted
 *      `refresh_token`, encrypts the fresh access_token + new expires_at,
 *      and writes back. Returns the fresh plaintext.
 *
 * Concurrency stance: we do NOT lock. Under simultaneous calls the
 * second call may also refresh — Google returns the same refresh_token
 * (it doesn't rotate on this grant), so the worst case is one extra
 * network call. SELECT FOR UPDATE on Neon serverless HTTP pool isn't
 * worth the operational complexity.
 *
 * Linked: FT-090, BR-12.
 */

import { eq } from 'drizzle-orm';
import { calendarConnections } from '@/lib/db/schema/calendar-connections';
import { scopedDb } from '@/lib/db/scoped';
import { encryptToken, decryptToken } from './tokens';
import { refreshAccessToken } from './google';

/** Refresh buffer — refresh proactively if token expires within this many seconds. */
const REFRESH_BUFFER_MS = 60_000;

export class ConnectionNotFoundError extends Error {
  constructor(connectionId: string) {
    super(`CalendarConnection not found: ${connectionId}`);
    this.name = 'ConnectionNotFoundError';
  }
}

/**
 * Resolve a valid access_token for `connectionId` belonging to `userId`.
 *
 * Refreshes via Google if `expires_at` is past or within ~60s. Throws
 * `ConnectionNotFoundError` if the connection doesn't belong to the
 * user (or doesn't exist).
 */
export async function getValidAccessToken(
  userId: string,
  connectionId: string,
  options: { now?: Date } = {}
): Promise<string> {
  const now = options.now ?? new Date();
  const sdb = scopedDb(userId);

  const rows = await sdb.select('calendarConnections', eq(calendarConnections.id, connectionId));
  if (rows.length === 0) {
    throw new ConnectionNotFoundError(connectionId);
  }
  const row = rows[0];

  const expiresAt = row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt);
  const isStale = expiresAt.getTime() - now.getTime() < REFRESH_BUFFER_MS;

  if (!isStale) {
    return decryptToken(row.accessToken);
  }

  // Stale — refresh via Google then write back.
  const refreshPlain = decryptToken(row.refreshToken);
  const fresh = await refreshAccessToken(refreshPlain);

  const newExpiresAt = new Date(now.getTime() + fresh.expires_in * 1000);
  await sdb
    .update('calendarConnections', {
      accessToken: encryptToken(fresh.access_token),
      expiresAt: newExpiresAt,
    })
    .where(eq(calendarConnections.id, connectionId))
    .execute();

  return fresh.access_token;
}
