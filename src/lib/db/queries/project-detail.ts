/**
 * Project detail loader. Returns project + category name + counts
 * (active activities) for the detail page.
 */

import { and, eq, isNull, count } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { projects } from '@/lib/db/schema/projects';
import { categories } from '@/lib/db/schema/categories';
import { activities } from '@/lib/db/schema/activities';

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  isInbox: boolean;
  categoryId: string;
  categoryName: string;
  deadline: string | null;
  outcomeExpected: string | null;
  activityCount: number;
}

export async function loadProjectDetail(
  userId: string,
  projectId: string
): Promise<ProjectDetail | null> {
  const rows = await db
    .select({
      project: projects,
      categoryName: categories.name,
    })
    .from(projects)
    .leftJoin(categories, eq(categories.id, projects.categoryId))
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, userId), isNull(projects.deletedAt))
    );
  if (rows.length === 0) return null;

  const countRows = await db
    .select({ c: count() })
    .from(activities)
    .where(and(eq(activities.projectId, projectId), isNull(activities.deletedAt)));

  const p = rows[0].project;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    isInbox: p.isInbox,
    categoryId: p.categoryId,
    categoryName: rows[0].categoryName ?? '',
    deadline: p.deadline,
    outcomeExpected: p.outcomeExpected,
    activityCount: countRows[0]?.c ?? 0,
  };
}
