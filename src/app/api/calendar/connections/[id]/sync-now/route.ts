/**
 * POST /api/calendar/connections/[id]/sync-now — ISSUE-091.
 *
 * Manual trigger for an immediate calendar sync. Validates ownership
 * via scopedDb, then publishes `calendar.sync.requested` which the
 * `calendar-sync-on-demand` Inngest function consumes. Responds 202
 * (accepted) since work happens asynchronously.
 *
 * Linked: OPS-6, FT-091.
 */

import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { calendarConnections } from '@/lib/db/schema/calendar-connections';
import { scopedDb } from '@/lib/db/scoped';
import { publish } from '@/lib/inngest/publish';

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

  await publish('calendar.sync.requested', { userId, connectionId: id });

  return Response.json({ ok: true }, { status: 202 });
}
