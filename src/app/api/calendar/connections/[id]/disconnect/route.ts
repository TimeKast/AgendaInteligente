/**
 * POST /api/calendar/connections/[id]/disconnect — ISSUE-090b.
 *
 * Sequence:
 *   1. Auth required.
 *   2. Read the connection via `scopedDb('calendarConnections')` —
 *      foreign id → 404 (enumeration-safe).
 *   3. Best-effort revoke at Google (idempotent; 400 invalid_token is
 *      treated as success).
 *   4. Delete the row.
 *
 * Failure mode: if revoke fails with a non-idempotent error, we DO NOT
 * delete the row — we write `last_sync_error` so the user can retry.
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

  // Attempt revoke. The refresh_token revokes the entire grant per
  // Google docs, so one call suffices.
  try {
    const plain = decryptToken(row.refreshToken);
    await revokeToken(plain);
  } catch (err) {
    logger.error('[calendar.disconnect] revoke failed; keeping row', {
      connectionId: id,
      error: (err as Error).message,
    });
    // Record the error so the UI can prompt the user to retry. We do
    // NOT delete the row — premature deletion strands the grant on
    // Google's side with no UI to clear it.
    await sdb
      .update('calendarConnections', {
        lastSyncError: `Revoke failed: ${(err as Error).message}`.slice(0, 500),
      })
      .where(eq(calendarConnections.id, id))
      .execute();
    return Response.json({ error: 'revoke_failed' }, { status: 502 });
  }

  await sdb.delete('calendarConnections').where(eq(calendarConnections.id, id)).execute();

  return Response.json({ ok: true });
}
