/**
 * Project-kill-suggestion weekly cron (Mondays) — ISSUE-087.
 *
 * Finds active projects that have had 0 done activities in the last
 * 21 days, suggests pausing/killing them.
 *
 * Cooldown: 30 days between suggestions per project (tracked on
 * projects.kill_suggested_at).
 *
 * Linked: FT-102.
 */

import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { projects } from '@/lib/db/schema/projects';
import { activities } from '@/lib/db/schema/activities';
import { enqueueAndSend } from '@/lib/notifications/proactive';
import { getInngest } from '../client';

const STALE_DAYS = 21;
const SUGGEST_COOLDOWN_DAYS = 30;

interface StepLike {
  run<T>(id: string, fn: () => Promise<T> | T): Promise<T>;
}
interface LoggerLike {
  info: (msg: string, ...rest: unknown[]) => void;
  error: (msg: string, ...rest: unknown[]) => void;
}

export async function runProjectKillSuggestion({
  step,
  logger,
  now = new Date(),
}: {
  step: StepLike;
  logger: LoggerLike;
  now?: Date;
}): Promise<{ projects: number; sent: number; skipped: number }> {
  const staleCutoff = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);
  const cooldownCutoff = new Date(now.getTime() - SUGGEST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

  // Candidate projects: active + not in cooldown + 0 done activities in
  // the stale window. We do a LEFT-JOIN-not-exists pattern: count(done
  // activities since cutoff) == 0.
  const candidates = await step.run('list-stale-projects', async () => {
    return db
      .select({
        id: projects.id,
        userId: projects.userId,
        name: projects.name,
      })
      .from(projects)
      .where(
        and(
          eq(projects.status, 'active'),
          isNull(projects.deletedAt),
          or(
            isNull(projects.killSuggestedAt),
            sql`${projects.killSuggestedAt} < ${cooldownCutoff}`
          ),
          // NOT EXISTS (SELECT 1 FROM activities WHERE project_id = ...
          //             AND status='done' AND updated_at >= staleCutoff)
          sql`NOT EXISTS (
            SELECT 1 FROM ${activities}
            WHERE ${activities.projectId} = ${projects.id}
              AND ${activities.status} = 'done'
              AND ${activities.updatedAt} >= ${staleCutoff}
          )`,
          // And: the project itself must be at least STALE_DAYS old so
          // we don't suggest killing freshly-created projects.
          sql`${projects.createdAt} <= ${staleCutoff}`
        )
      );
  });

  if (candidates.length === 0) {
    logger.info('[project.kill.suggestion] no stale projects');
    return { projects: 0, sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;
  for (const p of candidates) {
    const result = await step.run(`kill-${p.id}`, async () => {
      const r = await enqueueAndSend({
        userId: p.userId,
        type: 'project_kill_suggestion',
        title: p.name,
        body: 'No se ha movido en 3 semanas. ¿Pausamos o matamos?',
        url: `/projects/${p.id}`,
        payload: { project_id: p.id },
        now,
      });
      if (r.status === 'sent') {
        // Stamp cooldown only if we actually sent (gates that
        // cancelled don't trigger 30-day cooldown — re-suggest faster
        // when anti-spam clears).
        await db.update(projects).set({ killSuggestedAt: now }).where(eq(projects.id, p.id));
      }
      return r;
    });
    if (result.status === 'sent') sent++;
    else skipped++;
  }

  logger.info(
    `[project.kill.suggestion] projects=${candidates.length} sent=${sent} skipped=${skipped}`
  );
  return { projects: candidates.length, sent, skipped };
}

// Mondays 10:00 UTC.
export const projectKillSuggestion = getInngest().createFunction(
  { id: 'project-kill-suggestion-weekly', triggers: [{ cron: '0 10 * * 1' }] },
  runProjectKillSuggestion
);
