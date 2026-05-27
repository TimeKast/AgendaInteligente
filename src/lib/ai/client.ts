/**
 * Anthropic client + invoke wrapper — ISSUE-050 (Slice A1).
 *
 * Single shared client. Every call funnels through `invoke()` so:
 *   - Token usage gets recorded into `usage_meters` per user (telemetry).
 *   - Cache control is applied to the system prompt (Anthropic's prompt
 *     caching cuts input cost ~10x on warm hits).
 *   - The caller never touches the raw SDK — wrappers around 1 function
 *     are easier to swap if we change providers.
 *
 * Linked: FT-051, FT-054.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '@/lib/env';
import { logger } from '@/lib/logger';
import { DEFAULT_MODEL, estimateCostUsd, type ModelId, type TokenUsage } from './models';
import { recordTokens } from './telemetry';

let cached: Anthropic | null = null;

/** Lazy singleton. Re-reads env on first call so tests can stub. */
export function getAnthropicClient(): Anthropic {
  if (cached) return cached;
  cached = new Anthropic({ apiKey: getAnthropicKey() });
  return cached;
}

/** Reset for tests. */
export function _resetAnthropicForTests(): void {
  cached = null;
}

export interface InvokeOptions {
  userId: string;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  model?: ModelId;
  maxTokens?: number;
  /**
   * Whether to apply `cache_control: { type: 'ephemeral' }` to the
   * system prompt block. Default true — agent-base + ritual variants
   * are large + repeated, so the cache always pays off.
   */
  cacheSystemPrompt?: boolean;
}

export interface InvokeResult {
  text: string;
  usage: TokenUsage;
  costUsd: number;
  model: ModelId;
}

/**
 * Send a system + messages turn to Claude, record telemetry, return
 * the assistant's text reply.
 *
 * `cache_control` on the system block means Anthropic caches the
 * compiled prompt prefix for 5 minutes after first use — subsequent
 * calls within that window pay the cache-read rate (~10% of input).
 */
export async function invoke(opts: InvokeOptions): Promise<InvokeResult> {
  const model = opts.model ?? DEFAULT_MODEL;
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 1024,
    system:
      opts.cacheSystemPrompt === false
        ? opts.systemPrompt
        : [
            {
              type: 'text',
              text: opts.systemPrompt,
              cache_control: { type: 'ephemeral' },
            },
          ],
    messages: opts.messages,
  });

  // Extract text content (we ignore tool_use blocks here — ISSUE-050b
  // adds the structured-tool path for voice parsing).
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n');

  const usage: TokenUsage = {
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
    cacheRead: response.usage.cache_read_input_tokens ?? 0,
    cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
  };

  const costUsd = estimateCostUsd(model, usage);

  // Telemetry is fire-and-forget — a DB blip shouldn't fail the user
  // turn. We `await` only so unhandled rejections don't pollute the
  // event loop.
  try {
    await recordTokens(opts.userId, usage);
  } catch (err) {
    logger.error('[ai.invoke] recordTokens failed', err);
  }

  return { text, usage, costUsd, model };
}
