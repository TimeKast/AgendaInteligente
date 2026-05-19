import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sql, type SQL } from 'drizzle-orm';
import {
  generateHumanId,
  HUMAN_ID_PREFIXES,
  getNextHumanIdSeq,
  withHumanIdRetry,
} from './human-id';

describe('generateHumanId', () => {
  // Mock the date to ensure consistent year in tests
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-30'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with year (default)', () => {
    it('generates ID with correct format', () => {
      expect(generateHumanId(42, { prefix: 'ORD' })).toBe('ORD-2026-0042');
    });

    it('pads sequence to 4 digits by default', () => {
      expect(generateHumanId(1, { prefix: 'ORD' })).toBe('ORD-2026-0001');
      expect(generateHumanId(12, { prefix: 'ORD' })).toBe('ORD-2026-0012');
      expect(generateHumanId(123, { prefix: 'ORD' })).toBe('ORD-2026-0123');
      expect(generateHumanId(1234, { prefix: 'ORD' })).toBe('ORD-2026-1234');
    });

    it('does not truncate sequences longer than padLength', () => {
      expect(generateHumanId(12345, { prefix: 'ORD' })).toBe('ORD-2026-12345');
    });
  });

  describe('without year', () => {
    it('generates ID without year component', () => {
      expect(generateHumanId(1, { prefix: 'USR', includeYear: false })).toBe('USR-0001');
    });

    it('works with different prefixes', () => {
      expect(generateHumanId(42, { prefix: 'TKT', includeYear: false })).toBe('TKT-0042');
    });
  });

  describe('custom padding', () => {
    it('respects custom padLength', () => {
      expect(generateHumanId(1, { prefix: 'T', padLength: 6 })).toBe('T-2026-000001');
    });

    it('works with padLength of 2', () => {
      expect(generateHumanId(5, { prefix: 'A', padLength: 2 })).toBe('A-2026-05');
    });
  });

  describe('validation', () => {
    it('throws on zero sequence', () => {
      expect(() => generateHumanId(0, { prefix: 'ORD' })).toThrow(
        'Sequence must be a positive integer'
      );
    });

    it('throws on negative sequence', () => {
      expect(() => generateHumanId(-1, { prefix: 'ORD' })).toThrow(
        'Sequence must be a positive integer'
      );
    });

    it('throws on non-integer sequence', () => {
      expect(() => generateHumanId(1.5, { prefix: 'ORD' })).toThrow(
        'Sequence must be a positive integer'
      );
    });

    it('throws on empty prefix', () => {
      expect(() => generateHumanId(1, { prefix: '' })).toThrow('Prefix is required');
    });
  });

  describe('HUMAN_ID_PREFIXES', () => {
    it('exports common prefixes', () => {
      expect(HUMAN_ID_PREFIXES.USER).toBe('USR');
      expect(HUMAN_ID_PREFIXES.ORDER).toBe('ORD');
      expect(HUMAN_ID_PREFIXES.INVOICE).toBe('INV');
      expect(HUMAN_ID_PREFIXES.TICKET).toBe('TKT');
    });

    it('works with generateHumanId', () => {
      expect(generateHumanId(1, { prefix: HUMAN_ID_PREFIXES.ORDER })).toBe('ORD-2026-0001');
    });
  });
});

describe('withHumanIdRetry', () => {
  it('returns the result on first success', async () => {
    const op = vi.fn().mockResolvedValue('ok');
    const result = await withHumanIdRetry(op);
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries on 23505 (direct .code) and returns success on subsequent attempt', async () => {
    const violation = Object.assign(new Error('duplicate key'), { code: '23505' });
    const op = vi
      .fn()
      .mockRejectedValueOnce(violation)
      .mockRejectedValueOnce(violation)
      .mockResolvedValue('finally');
    const result = await withHumanIdRetry(op);
    expect(result).toBe('finally');
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('retries on 23505 wrapped in .cause.code (postgres-js / neon shape)', async () => {
    const violation = Object.assign(new Error('wrapped'), { cause: { code: '23505' } });
    const op = vi.fn().mockRejectedValueOnce(violation).mockResolvedValue('ok');
    const result = await withHumanIdRetry(op);
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry on non-23505 errors', async () => {
    const other = Object.assign(new Error('other'), { code: '42P01' });
    const op = vi.fn().mockRejectedValue(other);
    await expect(withHumanIdRetry(op)).rejects.toThrow('other');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('surfaces the last error after exhausting maxAttempts', async () => {
    const violation = Object.assign(new Error('always-collides'), { code: '23505' });
    const op = vi.fn().mockRejectedValue(violation);
    await expect(withHumanIdRetry(op, 3)).rejects.toThrow('always-collides');
    expect(op).toHaveBeenCalledTimes(3);
  });
});

describe('getNextHumanIdSeq', () => {
  // Minimal fake table + column — the helper only uses them as opaque SQL
  // references, so we don't need a real Drizzle pgTable here.
  const fakeColumn = sql`human_id` as unknown as Parameters<typeof getNextHumanIdSeq>[2];
  const fakeTable = sql`orders` as unknown as Parameters<typeof getNextHumanIdSeq>[1];

  type ChainableMock = {
    select: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    capturedExpr: SQL | null;
    capturedWhere: SQL | undefined;
  };

  function makeFakeExecutor(maxSeqReturn: number | null): ChainableMock {
    const state: ChainableMock = {
      capturedExpr: null,
      capturedWhere: undefined,
      select: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
    };

    // The helper does `executor.select({ maxSeq: expr }).from(table)` and
    // either awaits that directly or chains `.where(clause)`. The terminal
    // (whichever is awaited) must resolve to `[{ maxSeq }]`.
    const terminal = Promise.resolve([{ maxSeq: maxSeqReturn }]);

    state.where.mockImplementation((clause: SQL) => {
      state.capturedWhere = clause;
      return terminal;
    });

    const fromResult: Promise<unknown> & { where: typeof state.where } = Object.assign(
      // Awaitable when no .where() is chained:
      Promise.resolve([{ maxSeq: maxSeqReturn }]),
      { where: state.where }
    );

    state.from.mockImplementation(() => fromResult);

    state.select.mockImplementation((cols: { maxSeq: SQL }) => {
      state.capturedExpr = cols.maxSeq;
      return { from: state.from };
    });

    return state;
  }

  it('returns MAX + 1 from the executor result', async () => {
    const exec = makeFakeExecutor(7);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next = await getNextHumanIdSeq(exec as any, fakeTable, fakeColumn);
    expect(next).toBe(8);
  });

  it('returns 1 when the table is empty (MAX is NULL → COALESCE → 0)', async () => {
    const exec = makeFakeExecutor(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next = await getNextHumanIdSeq(exec as any, fakeTable, fakeColumn);
    expect(next).toBe(1);
  });

  it('returns 1 when the executor returns no rows at all', async () => {
    // Edge case: row?.maxSeq is undefined → fall back to 0 + 1
    const state: ChainableMock = {
      capturedExpr: null,
      capturedWhere: undefined,
      select: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
    };
    state.from.mockReturnValue(Promise.resolve([]));
    state.select.mockImplementation((cols: { maxSeq: SQL }) => {
      state.capturedExpr = cols.maxSeq;
      return { from: state.from };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next = await getNextHumanIdSeq(state as any, fakeTable, fakeColumn);
    expect(next).toBe(1);
  });

  it('passes the whereClause when provided (per-type partitioning)', async () => {
    const exec = makeFakeExecutor(3);
    const where = sql`type = 'APO'`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next = await getNextHumanIdSeq(exec as any, fakeTable, fakeColumn, where);
    expect(next).toBe(4);
    expect(exec.where).toHaveBeenCalledTimes(1);
    expect(exec.capturedWhere).toBe(where);
  });

  // 🔴 Regression gate — see human-id.ts §getNextHumanIdSeq.
  // If anyone "simplifies" the SUBSTRING regex from '([0-9]+)$' to '(\d+)$',
  // JS collapses the cooked template to '(d+)$' → MAX always NULL → seq
  // always 1 → permanent collisions. This test pins the literal char class.
  it('emits the SUBSTRING regex with literal [0-9]+ (NOT a backslash escape)', async () => {
    const exec = makeFakeExecutor(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getNextHumanIdSeq(exec as any, fakeTable, fakeColumn);

    const expr = exec.capturedExpr;
    expect(expr).not.toBeNull();
    // Drizzle's SQL object exposes the cooked template parts via queryChunks.
    // Stringify so we don't depend on the exact internal field name.
    const serialized = JSON.stringify(expr);
    expect(serialized).toContain('[0-9]+');
    // The cooked-collapsed bug pattern — must NOT appear:
    expect(serialized).not.toContain('(d+)$');
  });
});
