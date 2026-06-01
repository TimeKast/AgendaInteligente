/**
 * POST /api/ai/parse-task — ISSUE-073.
 *
 * Voice → structured task. Pipeline:
 *   1. Auth + rate-limit (200/h/user).
 *   2. Validate body.
 *   3. Load user TZ + preferred language + the user's active projects.
 *   4. Compute today-local for relative-date resolution.
 *   5. Render the voice-parser prompt + call Haiku with the
 *      `create_activity_preview` tool ONLY (no other tools — AI-9).
 *   6. Extract the tool_use input + return it. No DB write.
 *
 * Telemetry: bumps usage_meters via `recordTokens`. Latency target:
 * p95 < 2s (Haiku + ~500 input tokens).
 *
 * Linked: AI-9, FT-073, FT-100, R-P-005.
 */

import type Anthropic from '@anthropic-ai/sdk';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { projects } from '@/lib/db/schema/projects';
import { categories } from '@/lib/db/schema/categories';
import { getAnthropicClient } from '@/lib/ai/client';
import { VOICE_PARSER_MODEL, estimateCostUsd } from '@/lib/ai/models';
import { recordTokens } from '@/lib/ai/telemetry';
import {
  renderVoiceParser,
  CREATE_ACTIVITY_PREVIEW_TOOL,
} from '@/lib/ai/system-prompts/voice-parser';
import { localPartsAt } from '@/lib/domain/checkin-schedule';

const MAX_PROJECTS_IN_PROMPT = 50;

const requestSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = await checkRateLimit(userId, 'aiParseTask');
  if (!rl.success) return rateLimitExceededResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_request', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // ── Load user TZ + preferred language ───────────────────────────
  const userRows = await db
    .select({
      timezone: users.timezone,
      preferredLanguage: users.preferredLanguage,
    })
    .from(users)
    .where(eq(users.id, userId));
  if (userRows.length === 0) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }
  const u = userRows[0];
  const lang: 'es' | 'en' = u.preferredLanguage === 'en' ? 'en' : 'es';

  // ── Load the user's active projects (with category name) ────────
  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      categoryName: categories.name,
    })
    .from(projects)
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))
    .limit(MAX_PROJECTS_IN_PROMPT);

  // ── Today-local in user TZ ──────────────────────────────────────
  const { isoDate: todayLocal } = localPartsAt(new Date(), u.timezone);

  const systemPrompt = renderVoiceParser({
    preferredLanguage: lang,
    todayLocal,
    timezone: u.timezone,
    projects: projectRows.map((p) => ({
      id: p.id,
      name: p.name,
      categoryName: p.categoryName ?? undefined,
    })),
  });

  // ── Call Haiku with the preview tool only ───────────────────────
  let response: Anthropic.Messages.Message;
  try {
    response = await getAnthropicClient().messages.create({
      model: VOICE_PARSER_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      tools: [CREATE_ACTIVITY_PREVIEW_TOOL] as never,
      tool_choice: { type: 'tool' as const, name: 'create_activity_preview' } as never,
      messages: [{ role: 'user', content: parsed.data.text }],
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number })?.status;
    logger.error('[api/ai/parse-task] anthropic call failed', {
      reason,
      status,
      model: VOICE_PARSER_MODEL,
    });
    return Response.json({ error: 'upstream_failed', reason }, { status: 502 });
  }

  // Telemetry — never block on failure.
  try {
    await recordTokens(userId, {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      cacheRead: response.usage.cache_read_input_tokens ?? 0,
      cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
    });
  } catch (err) {
    logger.error('[api/ai/parse-task] recordTokens failed', err);
  }

  // The model is forced into the tool via `tool_choice`, so we expect
  // a `tool_use` content block. Be defensive: if absent (model
  // hallucinated text), return 502 — the client can show "Reintenta".
  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    logger.warn('[api/ai/parse-task] no tool_use block in response');
    return Response.json({ error: 'no_tool_use' }, { status: 502 });
  }

  const costUsd = estimateCostUsd(VOICE_PARSER_MODEL, {
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
    cacheRead: response.usage.cache_read_input_tokens ?? 0,
    cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
  });

  return Response.json({
    preview: toolUse.input,
    model: VOICE_PARSER_MODEL,
    costUsd,
  });
}
