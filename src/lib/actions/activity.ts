'use server';

/**
 * Activity server actions (ISSUE-013).
 *
 * Core CRUD only. Status transitions with reason_not_done validation are
 * deferred to ISSUE-017; here transitions are permissive (any → any) and
 * the action applies the BR-17 invariant on `done`.
 *
 * Invariants enforced:
 *   - BR-15: scheduled_dates normalized at the Zod transform layer
 *   - BR-16: durationMinutes requires scheduledTime (Zod refine)
 *   - BR-17: status='done' forces progress_percent=100 (applied here)
 *   - BR-2: project_id required; defaults to user's Inbox project when
 *     omitted, or throws if no Inbox exists yet (ISSUE-006 creates Inbox).
 *
 * Linked: E-005, BR-1, BR-2, BR-8, BR-15, BR-16, BR-17.
 */

import { eq, isNull, sql } from 'drizzle-orm';
import { activities, type Activity } from '@/lib/db/schema/activities';
import { projects } from '@/lib/db/schema/projects';
import { scopedDb } from '@/lib/db/scoped';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import {
  createActivitySchema,
  updateActivitySchema,
  deleteActivitySchema,
  transitionActivitySchema,
  listActivitiesSchema,
} from '@/lib/validations/activity';
import { isAllowedTransition, reasonRequirementFor } from '@/lib/domain/activity-transitions';
import { materializeUserRecurrences } from '@/lib/cron/recurrence';
import { logger } from '@/lib/logger';
import type { ActivityStatus } from '@/lib/db/schema/activities';

/** Find the Inbox project id for the user, or null if not yet seeded. */
async function findInboxProjectId(userId: string): Promise<string | null> {
  const sdb = scopedDb(userId);
  const rows = await sdb.select('projects', eq(projects.isInbox, true));
  return rows[0]?.id ?? null;
}

/**
 * Create a new activity. project_id defaults to user's Inbox when omitted.
 */
export async function createActivity(input: unknown): Promise<ActionResult<{ id: string }>> {
  return await withSelf(
    { schema: createActivitySchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      let projectId = data.projectId;
      if (!projectId) {
        const inbox = await findInboxProjectId(userId);
        if (!inbox) {
          throw new ActionError(
            'No se encontró el Inbox. Completá el onboarding antes de crear actividades.'
          );
        }
        projectId = inbox;
      }

      // BR-17 baseline: if status comes in as 'done', progress is 100.
      const status = data.status ?? 'pending';
      let progressPercent = data.progressPercent ?? null;
      if (status === 'done') progressPercent = 100;

      const inserted = await sdb
        .insert('activities', {
          projectId,
          title: data.title,
          description: data.description ?? null,
          scheduledDates: data.scheduledDates ?? [],
          scheduledTime: data.scheduledTime ?? null,
          durationMinutes: data.durationMinutes ?? null,
          deadline:
            data.deadline === undefined || data.deadline === null
              ? null
              : data.deadline instanceof Date
                ? data.deadline
                : new Date(data.deadline),
          estimatedMinutes: data.estimatedMinutes ?? null,
          priority: data.priority,
          quadrant: data.quadrant ?? null,
          progressPercent,
          recurrenceRule: data.recurrenceRule ?? null,
          status,
          reasonNotDone: data.reasonNotDone ?? null,
          reasonCategory: data.reasonCategory ?? null,
          tags: data.tags ?? [],
          completedAt: status === 'done' ? new Date() : null,
        })
        .returning({ id: activities.id });

      // Materialize the next ~14 days of instances when this activity is
      // a recurring parent — otherwise the user wouldn't see their "daily
      // L-V 7:30" task on /today until the cron next runs. Idempotent +
      // non-fatal: failures here log but don't roll back the parent insert.
      if (data.recurrenceRule) {
        try {
          await materializeUserRecurrences(userId);
        } catch (err) {
          logger.error('[createActivity] materializeUserRecurrences failed', err);
        }
      }

      return { id: inserted[0].id };
    }
  );
}

/**
 * Patch an activity. Status transitions are permissive here — ISSUE-017
 * adds the reason_not_done validation when status ∈ skipped|blocked.
 *
 * BR-17 is applied to the merged state (existing + patch):
 *   - merged.status === 'done' → progress_percent = 100
 *   - merged.status leaves 'done' → completed_at cleared
 */
export async function updateActivity(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: updateActivitySchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('activities', eq(activities.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Actividad no encontrada');
      }
      const current = existing[0];

      const updates: Partial<typeof activities.$inferInsert> & {
        completedAt?: Date | null;
        progressPercent?: number | null;
      } = {};

      const keys: Array<keyof typeof data> = [
        'title',
        'description',
        'projectId',
        'scheduledDates',
        'scheduledTime',
        'durationMinutes',
        'deadline',
        'estimatedMinutes',
        'priority',
        'quadrant',
        'progressPercent',
        'recurrenceRule',
        'status',
        'reasonNotDone',
        'reasonCategory',
        'tags',
      ];
      for (const k of keys) {
        if (data[k] !== undefined) {
          // deadline arrives as Date | string from Zod — normalize.
          if (k === 'deadline' && typeof data[k] === 'string') {
            (updates as Record<string, unknown>)[k] = new Date(data[k] as string);
          } else {
            (updates as Record<string, unknown>)[k] = data[k];
          }
        }
      }

      // BR-17: enforce on merged status.
      const mergedStatus = (updates.status ?? current.status) as string;
      if (mergedStatus === 'done') {
        updates.progressPercent = 100;
        if (!current.completedAt) updates.completedAt = new Date();
      } else if (current.status === 'done' && mergedStatus !== 'done') {
        updates.completedAt = null;
      }

      if (Object.keys(updates).length === 0) {
        return;
      }

      await sdb
        .update('activities', updates as Record<string, unknown>)
        .where(eq(activities.id, data.id))
        .execute();
    }
  );
}

/**
 * Guarded state-machine transition (ISSUE-017, BR-8).
 *
 * Public user-facing API for status changes. Unlike `updateActivity`
 * (which is permissive on status for internal/admin paths), this action:
 *
 *   1. Validates the (from, to) edge against the BR-8 matrix
 *      — `done → skipped` etc are rejected with ActionError.
 *   2. Enforces reason requirements:
 *      - `blocked` REQUIRES `reasonText` (textarea filled).
 *      - `skipped` accepts optional `reasonCategory` + `reasonText`.
 *      - Other targets ignore reason inputs.
 *   3. Applies BR-17 (status=done forces progress=100 + sets completed_at).
 *   4. Clears `completed_at` when leaving `done` (undo flow).
 *   5. Clears stale `reason_*` when transitioning to `pending` (re-activate).
 *   6. Logs a stub for the agent challenge layer (ISSUE-060) — when the
 *      user marks `skipped`/`blocked` without a reason category, the
 *      challenge system can pick up the gap.
 */
export async function transitionActivity(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: transitionActivitySchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('activities', eq(activities.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Actividad no encontrada');
      }
      const current = existing[0];
      const fromStatus = current.status as ActivityStatus;
      const toStatus = data.toStatus;

      // No-op when status doesn't change. Defensive — UI shouldn't request
      // it but a double-tap could.
      if (fromStatus === toStatus) return;

      if (!isAllowedTransition(fromStatus, toStatus)) {
        throw new ActionError('Transición no permitida');
      }

      const reqs = reasonRequirementFor(toStatus);
      if (reqs.textRequired && (!data.reasonText || data.reasonText.length === 0)) {
        throw new ActionError('Indica por qué está bloqueado');
      }

      const updates: Partial<typeof activities.$inferInsert> & {
        completedAt?: Date | null;
        reasonNotDone?: string | null;
        reasonCategory?: string | null;
        progressPercent?: number | null;
      } = {
        status: toStatus,
      };

      // BR-17: status=done forces progress=100 + completed_at.
      if (toStatus === 'done') {
        updates.progressPercent = 100;
        if (!current.completedAt) updates.completedAt = new Date();
      } else if (fromStatus === 'done') {
        // Undo from done — clear completed_at.
        updates.completedAt = null;
      }

      // Reason payload — only persisted when the target accepts it.
      if (reqs.categoryAllowed) {
        updates.reasonCategory = data.reasonCategory ?? null;
        updates.reasonNotDone = data.reasonText ?? null;
      } else if (toStatus === 'pending') {
        // Re-activating wipes stale reason fields.
        updates.reasonCategory = null;
        updates.reasonNotDone = null;
      }

      await sdb
        .update('activities', updates as Record<string, unknown>)
        .where(eq(activities.id, data.id))
        .execute();

      // ISSUE-060 stub — agent challenge picks up activities transitioned
      // to skipped/blocked without a reason category.
      if ((toStatus === 'skipped' || toStatus === 'blocked') && !data.reasonCategory) {
        logger.info(
          `[activity] transition ${fromStatus}→${toStatus} without reason_category (userId=${userId}, activityId=${data.id})`
        );
      }
    }
  );
}

// ─── Today screen anchor query ─────────────────────────────────────────

/**
 * Scope buckets used by the Today screen pool sidebar.
 *
 * Derived (not stored) from `scheduled_dates` relative to the user's
 * local `date` argument. Storing scope would force every recurrence
 * materialization + every drag-to-tomorrow to update a denorm field;
 * deriving here keeps the source of truth in `scheduled_dates` alone.
 */
export type ActivityScope = 'today_scheduled' | 'today_pool' | 'week' | 'backlog';

export interface ListActivitiesResult {
  /** All non-deleted activities for the user, with their derived scope. */
  rows: Array<Activity & { scope: ActivityScope }>;
  /** Quick split for the Today screen — same rows, regrouped. */
  scheduled: Array<Activity & { scope: 'today_scheduled' }>;
  pool: {
    todayUnscheduled: Activity[];
    thisWeek: Activity[];
    backlog: Activity[];
  };
}

/** Compute scope from scheduled_dates + scheduled_time relative to today. */
function classifyScope(act: Activity, today: string, weekEnd: string): ActivityScope {
  const dates = act.scheduledDates ?? [];
  if (dates.length === 0) return 'backlog';
  // `scheduled_dates` is sorted ascending (BR-15) — earliest date wins for scope.
  const next = dates.find((d) => d >= today);
  if (!next) return 'backlog'; // every scheduled date is in the past
  if (next === today) {
    return act.scheduledTime ? 'today_scheduled' : 'today_pool';
  }
  return next <= weekEnd ? 'week' : 'backlog';
}

/** YYYY-MM-DD of `date + days` in UTC arithmetic (no TZ ambiguity). */
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * List the user's activities and split them into Today screen buckets.
 *
 * - `today_scheduled` — has `scheduled_time` AND `scheduled_dates` includes today.
 * - `today_pool` — `scheduled_dates` includes today but no `scheduled_time`.
 * - `week` — earliest future scheduled date falls within today..today+6.
 * - `backlog` — no `scheduled_dates`, or every scheduled date is past.
 *
 * Tenant isolation: routed through `scopedDb` so cross-user reads are
 * impossible by construction (BR-1).
 */
export async function listActivities(input: unknown): Promise<ActionResult<ListActivitiesResult>> {
  return await withSelf({ schema: listActivitiesSchema }, input, async (data, userId) => {
    const sdb = scopedDb(userId);

    // Pull every non-deleted row in one query; client-side scope split
    // is cheap and avoids 3-4 round trips. Skip soft-deleted unless
    // explicitly asked (admin/debug use).
    const allRows = await sdb.select(
      'activities',
      data.includeDeleted ? undefined : isNull(activities.deletedAt)
    );

    // Recurring "parents" (rows with a recurrence_rule and no
    // recurrence_parent_id) are templates, not tasks to do. Hide them
    // from every user-facing list — the materialized instances (which
    // have recurrence_parent_id = parent.id and no rule of their own)
    // represent the actual work and surface on their scheduled dates.
    const isParentTemplate = (r: Activity): boolean =>
      r.recurrenceRule !== null && r.recurrenceParentId === null;

    const visible = allRows.filter((r) => !isParentTemplate(r));
    const filtered = data.includeDone ? visible : visible.filter((r) => r.status !== 'done');

    const weekEnd = addDays(data.date, 6);
    const annotated = filtered.map((r) => ({
      ...r,
      scope: classifyScope(r, data.date, weekEnd),
    }));

    const scheduled = annotated.filter(
      (r): r is Activity & { scope: 'today_scheduled' } => r.scope === 'today_scheduled'
    );
    const todayUnscheduled = annotated.filter((r) => r.scope === 'today_pool');
    const thisWeek = annotated.filter((r) => r.scope === 'week');
    const backlog = annotated.filter((r) => r.scope === 'backlog');

    return {
      rows: annotated,
      scheduled,
      pool: { todayUnscheduled, thisWeek, backlog },
    };
  });
}

/**
 * Soft-delete an activity. The project's RESTRICT FK is irrelevant for
 * soft-delete (it only triggers on hard DELETE), so this never cascades
 * to subtasks today; ISSUE-015 will handle subtask cleanup.
 */
export async function deleteActivity(input: unknown): Promise<ActionResult> {
  return await withSelf(
    { schema: deleteActivitySchema, revalidate: '/today' },
    input,
    async (data, userId) => {
      const sdb = scopedDb(userId);

      const existing = await sdb.select('activities', eq(activities.id, data.id));
      if (existing.length === 0) {
        throw new ActionError('Actividad no encontrada');
      }
      if (existing[0].deletedAt) {
        return; // idempotent
      }

      await sdb
        .update('activities', { deletedAt: sql`now()` })
        .where(eq(activities.id, data.id))
        .execute();
    }
  );
}
