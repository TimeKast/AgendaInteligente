/**
 * Catalog loaders for /categories and /projects pages.
 *
 * Server-side reads with explicit userId scoping (BR-1 allowlist
 * applies to src/lib/db/queries).
 */

import { eq, and, isNull, sql, asc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { categories } from '@/lib/db/schema/categories';
import { projects } from '@/lib/db/schema/projects';
import { activities } from '@/lib/db/schema/activities';

export interface CategoryListRow {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isInbox: boolean;
  projectCount: number;
  archivedAt: Date | null;
}

export interface ProjectListRow {
  id: string;
  name: string;
  status: string;
  categoryId: string;
  categoryName: string;
  isInbox: boolean;
  /**
   * Open activities tied to this project — `pending` or `in_progress`,
   * not deleted, and not a recurrence-master template (those are templates
   * users never see, only their materialized instances). Surfaced in the
   * /projects list so you see workload at a glance.
   */
  activeTaskCount: number;
}

export async function listCategories(
  userId: string,
  options: { includeArchived?: boolean } = {}
): Promise<CategoryListRow[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      icon: categories.icon,
      isInbox: categories.isInbox,
      projectCount: sql<number>`count(${projects.id})::int`,
      archivedAt: categories.archivedAt,
    })
    .from(categories)
    .leftJoin(projects, and(eq(projects.categoryId, categories.id), isNull(projects.deletedAt)))
    .where(and(eq(categories.userId, userId), isNull(categories.deletedAt)))
    .groupBy(categories.id)
    .orderBy(categories.isInbox, asc(categories.position), asc(categories.name));
  if (options.includeArchived) return rows;
  return rows.filter((r) => r.archivedAt === null);
}

export async function listProjects(userId: string): Promise<ProjectListRow[]> {
  // Count condition: 1 row per "thing the user has to do", not per
  // materialized instance. We count:
  //   - one-shot open tasks (recurrence_rule null, no parent), AND
  //   - recurrence master templates (recurrence_rule set, no parent) —
  //     each recurring habit shows up as 1, not as N pre-materialized
  //     instances for the next 14 days.
  // We EXCLUDE materialized instances (recurrence_parent_id not null)
  // because they're the schedule of an already-counted template.
  const activeTaskCountExpr = sql<number>`
    count(${activities.id}) filter (
      where ${activities.status} in ('pending','in_progress')
        and ${activities.deletedAt} is null
        and ${activities.recurrenceParentId} is null
    )::int
  `;

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      categoryId: projects.categoryId,
      categoryName: categories.name,
      categoryArchivedAt: categories.archivedAt,
      isInbox: projects.isInbox,
      activeTaskCount: activeTaskCountExpr,
    })
    .from(projects)
    .leftJoin(categories, eq(categories.id, projects.categoryId))
    .leftJoin(activities, eq(activities.projectId, projects.id))
    .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))
    .groupBy(projects.id, categories.name, categories.archivedAt)
    .orderBy(projects.isInbox, asc(projects.name));
  // Hide projects whose parent category is archived — they shouldn't
  // appear in pickers or list surfaces until the category is restored.
  return rows
    .filter((r) => r.categoryArchivedAt === null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      categoryId: r.categoryId,
      categoryName: r.categoryName ?? '',
      isInbox: r.isInbox,
      activeTaskCount: r.activeTaskCount ?? 0,
    }));
}
