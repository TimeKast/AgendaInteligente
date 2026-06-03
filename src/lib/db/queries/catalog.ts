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
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      categoryId: projects.categoryId,
      categoryName: categories.name,
      categoryArchivedAt: categories.archivedAt,
      isInbox: projects.isInbox,
    })
    .from(projects)
    .leftJoin(categories, eq(categories.id, projects.categoryId))
    .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))
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
    }));
}
