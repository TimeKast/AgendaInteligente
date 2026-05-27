/**
 * AI tool registry — ISSUE-053 (AI-9 + R-T-005 prompt injection defense).
 *
 * Anthropic tool definitions for every operation the agent can perform
 * against the user's data. **Critical invariant**: the agent NEVER
 * parses free-text as a database instruction — only validated tool
 * calls with explicit JSON Schemas land changes.
 *
 * Each tool entry has:
 *   - `name`: matches the LLM's tool_use block.
 *   - `description`: surfaced to the LLM so it knows when to call it.
 *   - `input_schema`: JSON Schema (Anthropic format) for the LLM.
 *   - `zodSchema`: runtime validation gate (the LLM may return bad
 *     shapes; Zod is the truth).
 *   - `handler`: thin wrapper around an existing server action — NO
 *     new business logic lives here. The handler receives a userId
 *     bound from the chat session AND the LLM-supplied input.
 *
 * Adversarial protection: handlers receive a fixed `userId` from the
 * session — even if the LLM puts a foreign id in the tool input, the
 * handler ignores it (the underlying actions all funnel through
 * `scopedDb(sessionUserId)`).
 *
 * Linked: AI-9, R-T-005, FT-051.
 */

import { z } from 'zod';
import { updateDaySheet } from '@/lib/actions/day-sheet';
import { createActivity, transitionActivity } from '@/lib/actions/activity';
import { linkGoal } from '@/lib/actions/goal-link';
import { setIntensityMode } from '@/lib/actions/intensity';
import type { ActionResult } from '@/lib/actions/types';

// ─── Tool definitions ──────────────────────────────────────────────────

/**
 * save_sheet_field: store one or more fields on the user's DaySheet
 * for `date`. Routes through `updateDaySheet` (which scopes to the
 * session userId). v1 supports DaySheet only — WeekSheet support
 * lands in ISSUE-033 wire.
 */
const saveSheetFieldSchema = z.object({
  sheet_type: z.literal('day'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  field: z.enum(['identityStatement', 'avoidance', 'closeSummary', 'notesDreams']),
  value: z.string().min(1).max(2000),
});

const updateActivityStatusSchema = z.object({
  activity_id: z.string().uuid(),
  to_status: z.enum(['pending', 'done', 'not_done', 'rescheduled']),
  reason_category: z
    .enum(['time', 'priority', 'blocked', 'didnt_want', 'other'])
    .nullable()
    .optional(),
  reason_text: z.string().max(500).nullable().optional(),
});

const createActivityToolSchema = z.object({
  title: z.string().min(1).max(200),
  projectId: z.string().uuid(),
  scheduledDates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .min(1)
    .optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
  priority: z.number().int().min(1).max(5).optional(),
});

const linkGoalToActivitySchema = z.object({
  goal_id: z.string().uuid(),
  activity_id: z.string().uuid(),
});

const setIntensityModeToolSchema = z.object({
  mode: z.enum(['sharp', 'standard', 'gentle', 'listening']),
});

// ─── Tool table ────────────────────────────────────────────────────────

/**
 * Shape of the JSON Schema Anthropic expects for `input_schema`.
 * Kept narrow — we don't ship `$ref`s or `oneOf` at this layer.
 */
interface JsonSchemaProperty {
  type: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: readonly string[];
  pattern?: string;
  items?: JsonSchemaProperty;
  minimum?: number;
  maximum?: number;
  nullable?: boolean;
}
interface JsonSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: readonly string[];
}

export interface AiTool {
  name: string;
  description: string;
  input_schema: JsonSchema;
  zodSchema: z.ZodTypeAny;
  /**
   * Executes the tool with the LLM-supplied input + the session userId.
   * `userId` always comes from the trusted session — NEVER from `input`.
   */
  handler: (input: unknown, userId: string) => Promise<ActionResult<unknown>>;
}

export const aiTools: Record<string, AiTool> = {
  save_sheet_field: {
    name: 'save_sheet_field',
    description:
      "Stores a single field on the user's DaySheet for the given date. Use this only after the user has clearly committed to the value (do NOT save provisional drafts).",
    input_schema: {
      type: 'object',
      properties: {
        sheet_type: { type: 'string', enum: ['day'] },
        date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        field: {
          type: 'string',
          enum: ['identityStatement', 'avoidance', 'closeSummary', 'notesDreams'],
        },
        value: { type: 'string' },
      },
      required: ['sheet_type', 'date', 'field', 'value'],
    },
    zodSchema: saveSheetFieldSchema,
    handler: async (input) => {
      const data = saveSheetFieldSchema.parse(input);
      // Map field to the DaySheet shape and delegate. updateDaySheet
      // scopes to the session userId internally via withSelf.
      return updateDaySheet({ date: data.date, [data.field]: data.value });
    },
  },

  update_activity_status: {
    name: 'update_activity_status',
    description:
      "Transitions an activity to a new status. When marking 'not_done' or 'rescheduled', include a reason category + optional free-text.",
    input_schema: {
      type: 'object',
      properties: {
        activity_id: { type: 'string' },
        to_status: {
          type: 'string',
          enum: ['pending', 'done', 'not_done', 'rescheduled'],
        },
        reason_category: {
          type: 'string',
          enum: ['time', 'priority', 'blocked', 'didnt_want', 'other'],
        },
        reason_text: { type: 'string' },
      },
      required: ['activity_id', 'to_status'],
    },
    zodSchema: updateActivityStatusSchema,
    handler: async (input) => {
      const data = updateActivityStatusSchema.parse(input);
      return transitionActivity({
        id: data.activity_id,
        toStatus: data.to_status,
        reasonCategory: data.reason_category ?? null,
        reasonText: data.reason_text ?? null,
      });
    },
  },

  create_activity: {
    name: 'create_activity',
    description:
      "Creates a new Activity under a Project. The agent must have a Project id (use the user's Inbox by default if no project mentioned).",
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        projectId: { type: 'string' },
        scheduledDates: {
          type: 'array',
          items: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        },
        scheduledTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
        durationMinutes: { type: 'integer', minimum: 1 },
        priority: { type: 'integer', minimum: 1, maximum: 5 },
      },
      required: ['title', 'projectId'],
    },
    zodSchema: createActivityToolSchema,
    handler: async (input) => {
      const data = createActivityToolSchema.parse(input);
      return createActivity({
        title: data.title,
        projectId: data.projectId,
        scheduledDates: data.scheduledDates,
        scheduledTime: data.scheduledTime ?? undefined,
        durationMinutes: data.durationMinutes ?? undefined,
        priority: data.priority,
      });
    },
  },

  link_goal_to_activity: {
    name: 'link_goal_to_activity',
    description:
      'Links an existing Goal to an existing Activity. Both must already exist; use create_activity first if needed.',
    input_schema: {
      type: 'object',
      properties: {
        goal_id: { type: 'string' },
        activity_id: { type: 'string' },
      },
      required: ['goal_id', 'activity_id'],
    },
    zodSchema: linkGoalToActivitySchema,
    handler: async (input) => {
      const data = linkGoalToActivitySchema.parse(input);
      return linkGoal({
        goalId: data.goal_id,
        targetType: 'activity',
        targetId: data.activity_id,
      });
    },
  },

  set_intensity_mode: {
    name: 'set_intensity_mode',
    description:
      "Changes the user's agent intensity. ONLY call this when the user EXPLICITLY asks to change it (e.g. 'pásame a sharp', 'I want listening mode'). Never volunteer the change.",
    input_schema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['sharp', 'standard', 'gentle', 'listening'] },
      },
      required: ['mode'],
    },
    zodSchema: setIntensityModeToolSchema,
    handler: async (input) => {
      const data = setIntensityModeToolSchema.parse(input);
      return setIntensityMode({ mode: data.mode });
    },
  },
};

/**
 * Build the array Anthropic's API expects in `tools:` on a messages.create call.
 */
export function getToolsForAnthropic() {
  return Object.values(aiTools).map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
}
