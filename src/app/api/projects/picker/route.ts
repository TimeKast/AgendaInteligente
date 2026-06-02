/**
 * GET /api/projects/picker — lightweight catalog for picker UIs.
 *
 * Used by client-only flows (voice capture sheet) that need to render
 * category + project selectors without a server-rendered page handing
 * them the data. Returns `{ projects, categories }` — shapes match
 * QuickAddProject / QuickAddCategory.
 *
 * Tenant-scoped via the auth session; cross-user reads are impossible by
 * construction (listProjects / listCategories filter by userId).
 */

import { auth } from '@/lib/auth/auth';
import { listProjects, listCategories } from '@/lib/db/queries/catalog';

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [projectRows, categoryRows] = await Promise.all([
    listProjects(session.user.id),
    listCategories(session.user.id),
  ]);
  const projects = projectRows.map((p) => ({
    id: p.id,
    name: p.name,
    isInbox: p.isInbox,
    categoryId: p.categoryId,
    categoryName: p.categoryName,
  }));
  const categories = categoryRows.map((c) => ({
    id: c.id,
    name: c.name,
    isInbox: c.isInbox,
  }));
  return Response.json({ projects, categories });
}
