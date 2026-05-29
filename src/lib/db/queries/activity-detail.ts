/**
 * Activity detail loader.
 *
 * Returns the activity row + its project name in one round-trip. Both
 * lookups are explicit-userId scoped on the WHERE clause (BR-1
 * allowlist applies to src/lib/db/queries).
 */

import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activities, type Activity } from '@/lib/db/schema/activities';
import { projects } from '@/lib/db/schema/projects';

export interface ActivityDetail extends Activity {
  projectName: string;
}

export async function loadActivityDetail(
  userId: string,
  activityId: string
): Promise<ActivityDetail | null> {
  const rows = await db
    .select({
      activity: activities,
      projectName: projects.name,
    })
    .from(activities)
    .leftJoin(projects, eq(projects.id, activities.projectId))
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.userId, userId),
        isNull(activities.deletedAt)
      )
    );
  if (rows.length === 0) return null;
  return {
    ...rows[0].activity,
    projectName: rows[0].projectName ?? '',
  };
}
