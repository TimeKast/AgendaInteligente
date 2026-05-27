/**
 * POST /api/ai/chat — SSE chat endpoint (ISSUE-052, Slice A1 + A2).
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
 *   7. Multi-turn tool loop (up to `MAX_TOOL_ROUNDS` rounds):
 *      - Stream Claude's response — forward text deltas as `token` SSE.
 *      - If `stop_reason === 'tool_use'`, dispatch the tool_use blocks,
 *        emit `tool_result` SSE events, append (assistant content,
 *        tool_result content) to the message list, loop.
 *      - Otherwise break (the model is done).
 *   8. Persist the agent message — concatenation of text across rounds,
 *      with `challenges_fired` + cumulative `tool_calls`.
 *   9. Emit `done` + close.
 *
 * Cap rationale: 4 rounds is enough for "ask → call A → ask follow-up
 * → call B → ack". Anything past that is almost always the model
 * looping on a tool that's returning an error. We surface
 * `tool_round_limit` so the UI can warn instead of hanging.
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
const MAX_TOOL_ROUNDS = 4;

// Anthropic SDK accepts `messages: Array<{ role, content: string | Array<ContentBlockParam> }>`.
// We mix: initial history rows carry plain strings; assistant turns we
// emit ourselves keep the full ContentBlock[] (text + tool_use) so the
// API can correlate the tool_use IDs with the follow-up tool_result.
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string | Array<Record<string, unknown>>;
};

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
  const initialMessages: ChatMessage[] = history.data.messages.map((m) => ({
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
      const allToolUses: ToolUseBlock[] = [];
      const usageTotal = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
      let hitRoundLimit = false;

      try {
        const client = getAnthropicClient();
        const conversation: ChatMessage[] = [...initialMessages];

        for (let round = 1; round <= MAX_TOOL_ROUNDS; round++) {
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
            // SDK type wants an index signature on each content block
            // that we don't model — safe cast (shape is correct).
            messages: conversation as never,
            tools: getToolsForAnthropic() as never,
          });

          messageStream.on('text', (delta) => {
            collectedText.push(delta);
            sse.send('token', { text: delta });
          });

          const finalMessage = await messageStream.finalMessage();
          usageTotal.input += finalMessage.usage.input_tokens;
          usageTotal.output += finalMessage.usage.output_tokens;
          usageTotal.cacheRead += finalMessage.usage.cache_read_input_tokens ?? 0;
          usageTotal.cacheWrite += finalMessage.usage.cache_creation_input_tokens ?? 0;

          const roundToolUses: ToolUseBlock[] = [];
          for (const block of finalMessage.content) {
            if (block.type === 'tool_use') {
              roundToolUses.push({
                type: 'tool_use',
                id: block.id,
                name: block.name,
                input: block.input,
              });
            }
          }

          // End-of-turn (no tool_use) → model is done talking.
          if (finalMessage.stop_reason !== 'tool_use' || roundToolUses.length === 0) {
            break;
          }

          allToolUses.push(...roundToolUses);
          const results = await dispatchAll(roundToolUses, userId);
          for (const r of results) {
            sse.send('tool_result', r);
          }

          // Append the assistant's full content (so the next turn sees
          // the tool_use IDs) and the user-role tool_result reply.
          conversation.push({
            role: 'assistant',
            content: finalMessage.content as unknown as Array<Record<string, unknown>>,
          });
          conversation.push({
            role: 'user',
            content: results as unknown as Array<Record<string, unknown>>,
          });

          if (round === MAX_TOOL_ROUNDS) {
            hitRoundLimit = true;
            sse.send('tool_round_limit', { rounds: round });
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
            allToolUses.length > 0
              ? allToolUses.map((t) => ({ name: t.name, input: t.input, id: t.id }))
              : undefined,
        });

        // Telemetry (fire-and-forget — a DB blip shouldn't break the
        // user's turn since the stream content already shipped).
        try {
          await recordTokens(userId, usageTotal);
        } catch (err) {
          logger.error('[api/ai/chat] recordTokens failed', err);
        }

        sse.send('done', {
          conversationId,
          agentMessageId: agentAppend.error ? null : agentAppend.data?.id,
          challengesFired,
          hitRoundLimit,
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
