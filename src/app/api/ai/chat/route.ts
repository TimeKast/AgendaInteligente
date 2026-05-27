/**
 * POST /api/ai/chat — SSE chat endpoint (ISSUE-052, Slice A1).
 *
 * Sequence:
 *   1. Auth + Zod validate the request body.
 *   2. Crisis pre-filter (`detectCrisisTrigger`, ISSUE-056). If fires:
 *      - Stamp `conversations.crisis_exit_at`.
 *      - Emit a single SSE `crisis_exit` event with the user's crisis
 *        line (resolved via TZ).
 *      - Close the stream. The LLM is NEVER called.
 *   3. getOrCreateConversation for the (channel, linkedSheet) thread.
 *   4. Persist the user message + run `detectVagueLanguage` to learn
 *      which challenges fired (for telemetry — system prompt already
 *      knows to challenge based on intensity_mode).
 *   5. Load the recent message history (last 50, chronological).
 *   6. Render the agent-base system prompt with the user's context.
 *   7. Stream Claude's response via `client.messages.stream`:
 *      - Forward every text delta as a `token` SSE event.
 *      - Collect tool_use blocks for post-stream dispatch.
 *   8. On stream end, dispatch any tool_use blocks (via `dispatchAll`),
 *      emit `tool_result` SSE events.
 *   9. Persist the agent message (full text + challenges_fired + tool_calls).
 *  10. Emit `done` + close.
 *
 * Slice scope: SINGLE-turn streaming + post-stream tool dispatch.
 * Multi-turn tool loops (LLM → tool → LLM follow-up) defer to
 * ISSUE-052b. The first round is the 90% case.
 *
 * Linked: FT-050, FT-051, AI-8, AI-9.
 */

import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { conversations } from '@/lib/db/schema/conversations';
import { scopedDb } from '@/lib/db/scoped';
import { getAnthropicClient } from '@/lib/ai/client';
import { DEFAULT_MODEL } from '@/lib/ai/models';
import { recordTokens } from '@/lib/ai/telemetry';
import { renderAgentBase, type IntensityMode } from '@/lib/ai/system-prompts/agent-base';
import { getToolsForAnthropic } from '@/lib/ai/tools';
import { dispatchAll, type ToolUseBlock } from '@/lib/ai/tools/dispatch';
import { detectCrisisTrigger, crisisLineForTimezone } from '@/lib/ai/crisis-detection';
import { detectVagueLanguage } from '@/lib/domain/challenge-detect';
import { getOrCreateConversation, appendMessage, listMessages } from '@/lib/actions/conversation';
import { makeSseWriter, SSE_HEADERS } from '@/lib/ai/sse';
import { chatRequestSchema } from '@/lib/validations/chat';

const HISTORY_LIMIT = 50;
const MAX_TOKENS = 1024;

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_request', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // ── Load user context (intensity, language, onboarding, TZ) ───────
  const userRows = await db
    .select({
      intensityMode: users.intensityMode,
      preferredLanguage: users.preferredLanguage,
      onboardingContext: users.onboardingContext,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.id, userId));
  if (userRows.length === 0) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }
  const userCtx = userRows[0];

  // ── Crisis pre-filter (BLOCKING) ──────────────────────────────────
  // Runs BEFORE any LLM cost. If the user is in distress, we don't
  // negotiate — we redirect to the crisis line and stop the stream.
  if (detectCrisisTrigger(data.message)) {
    // Resolve / open the conversation so we can stamp crisis_exit_at.
    const convResult = await getOrCreateConversation({
      linkedSheetType: data.linkedSheetType,
      linkedSheetId: data.linkedSheetId,
    });
    if (convResult.error || !convResult.data) {
      return Response.json({ error: convResult.error ?? 'conv_create_failed' }, { status: 500 });
    }
    const conversationId = convResult.data.id;

    const sdb = scopedDb(userId);
    await sdb
      .update('conversations', { crisisExitAt: new Date() })
      .where(eq(conversations.id, conversationId))
      .execute();

    const line = crisisLineForTimezone(userCtx.timezone);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const sse = makeSseWriter(controller);
        sse.send('crisis_exit', { conversationId, line });
        sse.send('done', { conversationId });
        sse.close();
      },
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  // ── Open / resume conversation + persist the user turn ───────────
  const convResult = await getOrCreateConversation({
    linkedSheetType: data.linkedSheetType,
    linkedSheetId: data.linkedSheetId,
  });
  if (convResult.error || !convResult.data) {
    return Response.json({ error: convResult.error ?? 'conv_create_failed' }, { status: 500 });
  }
  const conversationId = convResult.data.id;

  const userAppend = await appendMessage({
    conversationId,
    role: 'user',
    content: data.message,
  });
  if (userAppend.error || !userAppend.data) {
    return Response.json({ error: userAppend.error ?? 'append_failed' }, { status: 500 });
  }
  const userMessageId = userAppend.data.id;

  // ── Detect vague language for telemetry on the AGENT message ─────
  const lang: 'es' | 'en' = userCtx.preferredLanguage === 'en' ? 'en' : 'es';
  const vague = detectVagueLanguage(data.message, lang);
  // Agent reads the user's intensity to decide whether to actually
  // press; listening = never challenge.
  const challengesFired: string[] =
    vague.isVague && userCtx.intensityMode !== 'listening' ? ['vague_language'] : [];

  // ── Load history for the LLM (chronological, oldest first) ───────
  const history = await listMessages({ conversationId, limit: HISTORY_LIMIT });
  if (history.error || !history.data) {
    return Response.json({ error: history.error ?? 'history_failed' }, { status: 500 });
  }
  // history.data.messages includes the user message we just inserted.
  const messages = history.data.messages.map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }));

  // ── Render the system prompt with the user's context ─────────────
  const systemPrompt = renderAgentBase({
    intensityMode: userCtx.intensityMode as IntensityMode,
    preferredLanguage: lang,
    onboardingContext: userCtx.onboardingContext,
  });

  // ── Build the SSE response stream ────────────────────────────────
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const sse = makeSseWriter(controller);
      sse.send('user_message', { id: userMessageId });

      const collectedText: string[] = [];
      const collectedToolUses: ToolUseBlock[] = [];

      try {
        const client = getAnthropicClient();
        const messageStream = client.messages.stream({
          model: DEFAULT_MODEL,
          max_tokens: MAX_TOKENS,
          system: [
            {
              type: 'text',
              text: systemPrompt,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages,
          // `getToolsForAnthropic` returns properly-shaped JSON Schema
          // objects; Anthropic's type asks for an index signature we
          // can't model in our narrow JsonSchema interface — safe cast.
          tools: getToolsForAnthropic() as never,
        });

        messageStream.on('text', (delta) => {
          collectedText.push(delta);
          sse.send('token', { text: delta });
        });

        messageStream.on('contentBlock', (block) => {
          if (block.type === 'tool_use') {
            collectedToolUses.push({
              type: 'tool_use',
              id: block.id,
              name: block.name,
              input: block.input,
            });
          }
        });

        const finalMessage = await messageStream.finalMessage();

        // ── Dispatch any tool_use blocks (single round; multi-turn → A2)
        if (collectedToolUses.length > 0) {
          const results = await dispatchAll(collectedToolUses, userId);
          for (const r of results) {
            sse.send('tool_result', r);
          }
        }

        // ── Persist the agent message + record token usage ─────────
        const fullText = collectedText.join('');
        const agentAppend = await appendMessage({
          conversationId,
          role: 'agent',
          content: fullText,
          challengesFired,
          toolCalls:
            collectedToolUses.length > 0
              ? collectedToolUses.map((t) => ({ name: t.name, input: t.input, id: t.id }))
              : undefined,
        });

        // Telemetry (fire-and-forget — a DB blip shouldn't break the
        // user's turn since the stream content already shipped).
        try {
          await recordTokens(userId, {
            input: finalMessage.usage.input_tokens,
            output: finalMessage.usage.output_tokens,
            cacheRead: finalMessage.usage.cache_read_input_tokens ?? 0,
            cacheWrite: finalMessage.usage.cache_creation_input_tokens ?? 0,
          });
        } catch (err) {
          logger.error('[api/ai/chat] recordTokens failed', err);
        }

        sse.send('done', {
          conversationId,
          agentMessageId: agentAppend.error ? null : agentAppend.data?.id,
          challengesFired,
        });
      } catch (err) {
        logger.error('[api/ai/chat] stream failed', err);
        sse.send('error', {
          error: 'stream_failed',
          message: (err as Error).message,
        });
      } finally {
        sse.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
