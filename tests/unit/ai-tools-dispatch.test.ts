/**
 * Tests for AI tool registry + dispatcher — ISSUE-053.
 *
 * AI-9 contract: every tool call lands as a typed Zod-validated input.
 * Adversarial cases (unknown tool, garbage input, prompt injection
 * attempts via tool_use blocks) MUST return tool_result with is_error
 * — never throw, never bypass the action layer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateDaySheetMock = vi.fn();
const createActivityMock = vi.fn();
const transitionActivityMock = vi.fn();
const linkGoalMock = vi.fn();
const setIntensityModeMock = vi.fn();

vi.mock('@/lib/actions/day-sheet', () => ({ updateDaySheet: updateDaySheetMock }));
vi.mock('@/lib/actions/activity', () => ({
  createActivity: createActivityMock,
  transitionActivity: transitionActivityMock,
}));
vi.mock('@/lib/actions/goal-link', () => ({ linkGoal: linkGoalMock }));
vi.mock('@/lib/actions/intensity', () => ({ setIntensityMode: setIntensityModeMock }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ACTIVITY = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const GOAL = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PROJECT = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function reset() {
  vi.clearAllMocks();
  updateDaySheetMock.mockResolvedValue({ data: { id: 'sheet-1' } });
  createActivityMock.mockResolvedValue({ data: { id: 'act-1' } });
  transitionActivityMock.mockResolvedValue({ data: undefined });
  linkGoalMock.mockResolvedValue({ data: { id: 'link-1' } });
  setIntensityModeMock.mockResolvedValue({ data: { mode: 'sharp', expiresAt: null } });
}

beforeEach(reset);

describe('aiTools registry', () => {
  it('exposes the 5 v1 tools', async () => {
    const { aiTools } = await import('@/lib/ai/tools');
    expect(Object.keys(aiTools).sort()).toEqual([
      'create_activity',
      'link_goal_to_activity',
      'save_sheet_field',
      'set_intensity_mode',
      'update_activity_status',
    ]);
  });

  it('every tool has name + description + input_schema + zodSchema + handler', async () => {
    const { aiTools } = await import('@/lib/ai/tools');
    for (const tool of Object.values(aiTools)) {
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.input_schema.type).toBe('object');
      expect(tool.zodSchema).toBeDefined();
      expect(typeof tool.handler).toBe('function');
    }
  });

  it('getToolsForAnthropic produces the array shape the SDK consumes', async () => {
    const { getToolsForAnthropic } = await import('@/lib/ai/tools');
    const arr = getToolsForAnthropic();
    expect(arr).toHaveLength(5);
    for (const t of arr) {
      expect(Object.keys(t)).toEqual(['name', 'description', 'input_schema']);
    }
  });
});

describe('dispatchTool — happy paths', () => {
  it('save_sheet_field calls updateDaySheet with the mapped field', async () => {
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    const result = await dispatchTool(
      {
        type: 'tool_use',
        id: 'tu-1',
        name: 'save_sheet_field',
        input: {
          sheet_type: 'day',
          date: '2026-05-26',
          field: 'identityStatement',
          value: 'Hoy soy alguien que cierra ciclos',
        },
      },
      USER
    );

    expect(result.type).toBe('tool_result');
    expect(result.tool_use_id).toBe('tu-1');
    expect(result.is_error).toBeFalsy();
    expect(updateDaySheetMock).toHaveBeenCalledWith({
      date: '2026-05-26',
      identityStatement: 'Hoy soy alguien que cierra ciclos',
    });
  });

  it('update_activity_status passes reason fields to transitionActivity', async () => {
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    await dispatchTool(
      {
        type: 'tool_use',
        id: 'tu-2',
        name: 'update_activity_status',
        input: {
          activity_id: ACTIVITY,
          to_status: 'not_done',
          reason_category: 'time',
          reason_text: 'Bloque de reunión se extendió',
        },
      },
      USER
    );

    expect(transitionActivityMock).toHaveBeenCalledWith({
      id: ACTIVITY,
      toStatus: 'not_done',
      reasonCategory: 'time',
      reasonText: 'Bloque de reunión se extendió',
    });
  });

  it('link_goal_to_activity wraps linkGoal with targetType=activity', async () => {
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    await dispatchTool(
      {
        type: 'tool_use',
        id: 'tu-3',
        name: 'link_goal_to_activity',
        input: { goal_id: GOAL, activity_id: ACTIVITY },
      },
      USER
    );

    expect(linkGoalMock).toHaveBeenCalledWith({
      goalId: GOAL,
      targetType: 'activity',
      targetId: ACTIVITY,
    });
  });

  it('set_intensity_mode forwards the mode value', async () => {
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    await dispatchTool(
      { type: 'tool_use', id: 'tu-4', name: 'set_intensity_mode', input: { mode: 'sharp' } },
      USER
    );

    expect(setIntensityModeMock).toHaveBeenCalledWith({ mode: 'sharp' });
  });

  it('create_activity forwards to createActivity', async () => {
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    await dispatchTool(
      {
        type: 'tool_use',
        id: 'tu-5',
        name: 'create_activity',
        input: {
          title: 'Llamar a María',
          projectId: PROJECT,
          scheduledDates: ['2026-05-27'],
          scheduledTime: '15:00',
          durationMinutes: 30,
          priority: 3,
        },
      },
      USER
    );

    expect(createActivityMock).toHaveBeenCalledWith({
      title: 'Llamar a María',
      projectId: PROJECT,
      scheduledDates: ['2026-05-27'],
      scheduledTime: '15:00',
      durationMinutes: 30,
      priority: 3,
    });
  });
});

describe('dispatchTool — adversarial / error paths', () => {
  it('unknown tool returns is_error without throwing', async () => {
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    const result = await dispatchTool(
      { type: 'tool_use', id: 'tu-x', name: 'delete_all_activities', input: {} },
      USER
    );

    expect(result.is_error).toBe(true);
    expect(result.content).toContain('unknown_tool');
    expect(updateDaySheetMock).not.toHaveBeenCalled();
    expect(createActivityMock).not.toHaveBeenCalled();
  });

  it('Zod validation failure surfaces issues + does NOT call the action', async () => {
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    const result = await dispatchTool(
      {
        type: 'tool_use',
        id: 'tu-bad',
        name: 'save_sheet_field',
        input: {
          sheet_type: 'day',
          date: 'tomorrow', // not YYYY-MM-DD
          field: 'identityStatement',
          value: 'foo',
        },
      },
      USER
    );

    expect(result.is_error).toBe(true);
    expect(result.content).toContain('invalid_input');
    expect(updateDaySheetMock).not.toHaveBeenCalled();
  });

  it('action error becomes tool_result is_error (no throw)', async () => {
    transitionActivityMock.mockResolvedValueOnce({ error: 'Actividad no encontrada' });
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    const result = await dispatchTool(
      {
        type: 'tool_use',
        id: 'tu-404',
        name: 'update_activity_status',
        input: { activity_id: ACTIVITY, to_status: 'done' },
      },
      USER
    );

    expect(result.is_error).toBe(true);
    expect(result.content).toContain('Actividad no encontrada');
  });

  it('unexpected throw is caught and rendered as tool_failed', async () => {
    transitionActivityMock.mockRejectedValueOnce(new Error('DB outage'));
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    const result = await dispatchTool(
      {
        type: 'tool_use',
        id: 'tu-boom',
        name: 'update_activity_status',
        input: { activity_id: ACTIVITY, to_status: 'done' },
      },
      USER
    );

    expect(result.is_error).toBe(true);
    expect(result.content).toContain('tool_failed');
  });

  it('rejects bogus enum values (e.g. fake status)', async () => {
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    const result = await dispatchTool(
      {
        type: 'tool_use',
        id: 'tu-enum',
        name: 'update_activity_status',
        input: { activity_id: ACTIVITY, to_status: 'cancelled' }, // not in enum
      },
      USER
    );

    expect(result.is_error).toBe(true);
    expect(transitionActivityMock).not.toHaveBeenCalled();
  });

  it('save_sheet_field rejects unknown field (no surprise column writes)', async () => {
    const { dispatchTool } = await import('@/lib/ai/tools/dispatch');
    const result = await dispatchTool(
      {
        type: 'tool_use',
        id: 'tu-field',
        name: 'save_sheet_field',
        input: {
          sheet_type: 'day',
          date: '2026-05-26',
          field: 'is_admin', // attacker-injected
          value: 'true',
        },
      },
      USER
    );

    expect(result.is_error).toBe(true);
    expect(updateDaySheetMock).not.toHaveBeenCalled();
  });
});

describe('dispatchAll', () => {
  it('runs an array of tool_use blocks in parallel', async () => {
    const { dispatchAll } = await import('@/lib/ai/tools/dispatch');
    const results = await dispatchAll(
      [
        {
          type: 'tool_use',
          id: 'a',
          name: 'set_intensity_mode',
          input: { mode: 'sharp' },
        },
        {
          type: 'tool_use',
          id: 'b',
          name: 'link_goal_to_activity',
          input: { goal_id: GOAL, activity_id: ACTIVITY },
        },
      ],
      USER
    );

    expect(results).toHaveLength(2);
    expect(results[0].tool_use_id).toBe('a');
    expect(results[1].tool_use_id).toBe('b');
    expect(setIntensityModeMock).toHaveBeenCalledOnce();
    expect(linkGoalMock).toHaveBeenCalledOnce();
  });
});
