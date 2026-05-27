/**
 * Tool dispatcher — ISSUE-053.
 *
 * Given an Anthropic `tool_use` block, look up the handler in the
 * registry, run it with the session userId, and return a Anthropic
 * `tool_result` block suitable for sending back in the next turn.
 *
 * Errors are FORMATTED into tool_result with `is_error: true` so the
 * agent can read the rejection and self-correct (try a different field,
 * acknowledge the failure to the user, etc.). We never throw out of
 * here — the chat route relies on this being total over the input.
 *
 * Linked: AI-9, R-T-005, FT-051.
 */

import { ZodError } from 'zod';
import { aiTools } from './index';
import { logger } from '@/lib/logger';

/** Shape Anthropic uses for a single tool_use block. */
export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: unknown;
}

/** Shape we send back as the tool_result block. */
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export async function dispatchTool(block: ToolUseBlock, userId: string): Promise<ToolResultBlock> {
  const tool = aiTools[block.name];
  if (!tool) {
    // Unknown tool — the LLM hallucinated one. Reflect the error back
    // so it knows to stop trying.
    logger.warn(`[ai.dispatch] unknown tool requested: ${block.name}`);
    return {
      type: 'tool_result',
      tool_use_id: block.id,
      content: JSON.stringify({ error: `unknown_tool: ${block.name}` }),
      is_error: true,
    };
  }

  try {
    const result = await tool.handler(block.input, userId);
    if (result.error) {
      return {
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify({ error: result.error }),
        is_error: true,
      };
    }
    return {
      type: 'tool_result',
      tool_use_id: block.id,
      content: JSON.stringify(result.data ?? { ok: true }),
    };
  } catch (err) {
    // Zod validation failure → return shape so the LLM can retry with
    // a corrected payload. Other errors → generic to avoid leaking
    // internal state.
    if (err instanceof ZodError) {
      const issues = err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return {
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify({ error: 'invalid_input', issues }),
        is_error: true,
      };
    }
    logger.error(`[ai.dispatch] tool ${block.name} threw`, err);
    return {
      type: 'tool_result',
      tool_use_id: block.id,
      content: JSON.stringify({ error: 'tool_failed' }),
      is_error: true,
    };
  }
}

/** Convenience: dispatch every tool_use block in a Claude response. */
export async function dispatchAll(
  blocks: ToolUseBlock[],
  userId: string
): Promise<ToolResultBlock[]> {
  return Promise.all(blocks.map((b) => dispatchTool(b, userId)));
}
