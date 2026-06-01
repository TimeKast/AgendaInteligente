/**
 * GET /api/projects/picker — lightweight project list for picker UIs.
 *
 * Used by client-only flows (voice capture sheet) that need to render a
 * project selector without a server-rendered page handing them the list.
 * Returns `{ id, name, isInbox }[]` — same shape `QuickAddProject` expects.
 *
 * Tenant-scoped via the auth session; cross-user reads are impossible by
 * construction (listProjects filters by userId).
 */

import { auth } from '@/lib/auth/auth';
import { listProjects } from '@/lib/db/queries/catalog';

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await listProjects(session.user.id);
  const projects = rows.map((p) => ({ id: p.id, name: p.name, isInbox: p.isInbox }));
  return Response.json({ projects });
}
