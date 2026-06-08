/**
 * Tests for the BR-8 activity transition matrix (ISSUE-017).
 *
 * Pure domain functions — no DB, no auth. Exhaustively covers the
 * 5×5 status grid + reason requirement rules.
 */

import { describe, it, expect } from 'vitest';
import {
  isAllowedTransition,
  getAllowedNextStatuses,
  reasonRequirementFor,
  ALLOWED_TRANSITIONS,
} from '@/lib/domain/activity-transitions';
import { ACTIVITY_STATUSES, type ActivityStatus } from '@/lib/db/schema/activities';

// Per BR-8 §05_BUSINESS_RULES.md (source of truth — keep in sync).
// Cancelled added as a terminal state (with undo path back to pending).
const EXPECTED: Record<ActivityStatus, ActivityStatus[]> = {
  pending: ['in_progress', 'done', 'skipped', 'blocked', 'cancelled'],
  in_progress: ['done', 'blocked', 'pending', 'cancelled'],
  done: ['pending'],
  skipped: ['pending', 'cancelled'],
  blocked: ['in_progress', 'pending', 'cancelled'],
  cancelled: ['pending'],
};

describe('isAllowedTransition — BR-8 matrix', () => {
  it('self-edges are always disallowed', () => {
    for (const s of ACTIVITY_STATUSES) {
      expect(isAllowedTransition(s, s)).toBe(false);
    }
  });

  it('every allowed edge in BR-8 returns true', () => {
    for (const [from, targets] of Object.entries(EXPECTED) as Array<
      [ActivityStatus, ActivityStatus[]]
    >) {
      for (const to of targets) {
        expect(isAllowedTransition(from, to), `expected ${from} → ${to} ALLOWED`).toBe(true);
      }
    }
  });

  it('every edge NOT in BR-8 returns false (5×5 grid coverage)', () => {
    for (const from of ACTIVITY_STATUSES) {
      for (const to of ACTIVITY_STATUSES) {
        const expected = from !== to && EXPECTED[from].includes(to);
        expect(isAllowedTransition(from, to), `expected ${from} → ${to} to be ${expected}`).toBe(
          expected
        );
      }
    }
  });

  it('explicitly rejects done → skipped (BR-8 forbidden)', () => {
    expect(isAllowedTransition('done', 'skipped')).toBe(false);
  });

  it('explicitly rejects done → blocked (BR-8 forbidden)', () => {
    expect(isAllowedTransition('done', 'blocked')).toBe(false);
  });

  it('explicitly rejects skipped → done (must go via pending)', () => {
    expect(isAllowedTransition('skipped', 'done')).toBe(false);
  });

  it('explicitly rejects skipped → in_progress (must go via pending)', () => {
    expect(isAllowedTransition('skipped', 'in_progress')).toBe(false);
  });
});

describe('getAllowedNextStatuses', () => {
  it('returns the full target set per BR-8', () => {
    for (const [from, targets] of Object.entries(EXPECTED) as Array<
      [ActivityStatus, ActivityStatus[]]
    >) {
      const got = getAllowedNextStatuses(from).sort();
      expect(got).toEqual([...targets].sort());
    }
  });

  it('does not include the from status in the next-set', () => {
    for (const s of ACTIVITY_STATUSES) {
      expect(getAllowedNextStatuses(s)).not.toContain(s);
    }
  });
});

describe('reasonRequirementFor', () => {
  it('blocked requires text and accepts category', () => {
    expect(reasonRequirementFor('blocked')).toEqual({
      textRequired: true,
      categoryAllowed: true,
    });
  });

  it('skipped accepts category but does not require text', () => {
    expect(reasonRequirementFor('skipped')).toEqual({
      textRequired: false,
      categoryAllowed: true,
    });
  });

  it('done / pending / in_progress accept no reason input', () => {
    for (const s of ['done', 'pending', 'in_progress'] as ActivityStatus[]) {
      expect(reasonRequirementFor(s)).toEqual({
        textRequired: false,
        categoryAllowed: false,
      });
    }
  });
});

describe('ALLOWED_TRANSITIONS export shape', () => {
  it('has an entry for every status (no holes)', () => {
    for (const s of ACTIVITY_STATUSES) {
      expect(ALLOWED_TRANSITIONS[s]).toBeDefined();
    }
  });
});
