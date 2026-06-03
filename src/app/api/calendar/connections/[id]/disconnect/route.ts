/**
 * POST /api/calendar/connections/[id]/disconnect — ISSUE-090b.
 *
 * Sequence:
 *   1. Auth required.
 *   2. Read the connection via `scopedDb('calendarConnections')` —
 *      foreign id → 404 (enumeration-safe).
 *   3. Google: best-effort revoke (idempotent; 400 invalid_token treated
 *      as success). Microsoft: no programmatic revoke endpoint that
 *      mirrors Google's UX — we just drop the local row. The user can
 *      revoke from account.microsoft.com if they want to nuke the grant.
 *   4. Delete the row.
 *
 * Failure mode (Google only): if revoke fails non-idempotently, DO NOT
 * delete the row — write `last_sync_error` so the user can retry.
 * Otherwise users can end up with stale grants on Google's side that
 * they can't revoke from our UI.
 *
 * Linked: FT-090.
 */

import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';
import { calendarConnections } from '@/lib/db/schema/calendar-connections';
import { scopedDb } from '@/lib/db/scoped';
import { decryptToken } from '@/lib/integrations/calendar/tokens';
import { revokeToken } from '@/lib/integrations/calendar/google';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const sdb = scopedDb(userId);
  const rows = await sdb.select('calendarConnections', eq(calendarConnections.id, id));
  if (rows.length === 0) {
    return Response.json({ error: 'Connection not found' }, { status: 404 });
  }
  const row = rows[0];

  // Google: refresh_token revokes the entire grant per docs, so one
  // call suffices. Microsoft: no equivalent endpoint — local drop only.
  if (row.provider === 'google') {
    try {
      const plain = decryptToken(row.refreshToken);
      await revokeToken(plain);
    } catch (err) {
      logger.error('[calendar.disconnect] revoke failed; keeping row', {
        connectionId: id,
        error: (err as Error).message,
      });
      await sdb
        .update('calendarConnections', {
          lastSyncError: `Revoke failed: ${(err as Error).message}`.slice(0, 500),
        })
        .where(eq(calendarConnections.id, id))
        .execute();
      return Response.json({ error: 'revoke_failed' }, { status: 502 });
    }
  }

  await sdb.delete('calendarConnections').where(eq(calendarConnections.id, id)).execute();

  return Response.json({ ok: true });
}
