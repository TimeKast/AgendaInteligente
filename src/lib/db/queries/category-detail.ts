/**
 * Category detail loader. Returns the category + a count of its
 * non-deleted projects (used to gate delete in the UI).
 */

import { and, eq, isNull, count } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { categories } from '@/lib/db/schema/categories';
import { projects } from '@/lib/db/schema/projects';

export interface CategoryDetail {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isInbox: boolean;
  projectCount: number;
}

export async function loadCategoryDetail(
  userId: string,
  categoryId: string
): Promise<CategoryDetail | null> {
  const catRows = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      icon: categories.icon,
      isInbox: categories.isInbox,
    })
    .from(categories)
    .where(
      and(
        eq(categories.id, categoryId),
        eq(categories.userId, userId),
        isNull(categories.deletedAt)
      )
    );
  if (catRows.length === 0) return null;

  const countRows = await db
    .select({ c: count() })
    .from(projects)
    .where(and(eq(projects.categoryId, categoryId), isNull(projects.deletedAt)));

  return { ...catRows[0], projectCount: countRows[0]?.c ?? 0 };
}
