/**
 * Goals catalog loader. Reads non-deleted goals for the user, ordered
 * by scope (quarter → year → 5year → life) then by deadline asc, then
 * created_at asc. Explicit userId scoping (BR-1 allowlist applies).
 */

import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { goals } from '@/lib/db/schema/goals';

export interface GoalListRow {
  id: string;
  title: string;
  scope: string;
  status: string;
  deadline: string | null;
}

export async function listGoals(userId: string): Promise<GoalListRow[]> {
  const rows = await db
    .select({
      id: goals.id,
      title: goals.title,
      scope: goals.scope,
      status: goals.status,
      deadline: goals.deadline,
    })
    .from(goals)
    .where(and(eq(goals.userId, userId), isNull(goals.deletedAt)))
    .orderBy(asc(goals.scope), asc(goals.deadline), asc(goals.createdAt));
  return rows;
}

export async function loadGoalDetail(userId: string, goalId: string) {
  const rows = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId), isNull(goals.deletedAt)));
  return rows[0] ?? null;
}
