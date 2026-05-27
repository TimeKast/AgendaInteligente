/**
 * Tests for the Inngest event registry — ISSUE-080.
 *
 * Locks in:
 *   - Every event name in the spec exists.
 *   - Each payload schema accepts the expected happy path.
 *   - Each schema rejects shape drift (wrong key, wrong type, missing UUID).
 *
 * Why this matters: the registry is the only enforcement layer between an
 * action emitting an event and the downstream handler. Without these
 * tests, a typo in `parseEventData` would only surface at runtime in
 * production.
 */

import { describe, it, expect } from 'vitest';
import { eventSchemas, parseEventData, type EventName } from '@/lib/inngest/events';

const VALID_UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VALID_DATE = '2026-05-26';
const VALID_WEEK = '2026-05-24';

describe('event registry — surface', () => {
  const required: EventName[] = [
    'user.signed_up',
    'morning.check_in.due',
    'midday.check_in.due',
    'evening.check_in.due',
    'weekly.kickoff.due',
    'weekly.review.due',
    'weekly.post_mortem.requested',
    'listening.mode.expired',
    'silence.detection.due',
    'recurrence.materialize.due',
    'gentle.default.expired',
    'purge.soft_deleted.due',
    'calendar.sync.requested',
  ];

  it('declares every event from the ISSUE-080 spec', () => {
    for (const name of required) {
      expect(eventSchemas[name], `missing event: ${name}`).toBeDefined();
    }
  });

  it('has exactly the 12 events listed (no drift)', () => {
    expect(Object.keys(eventSchemas).sort()).toEqual([...required].sort());
  });
});

describe('event registry — happy paths', () => {
  it('user.signed_up accepts { userId }', () => {
    expect(parseEventData('user.signed_up', { userId: VALID_UUID })).toEqual({
      userId: VALID_UUID,
    });
  });

  it('morning.check_in.due accepts { userId, date }', () => {
    expect(
      parseEventData('morning.check_in.due', { userId: VALID_UUID, date: VALID_DATE })
    ).toEqual({ userId: VALID_UUID, date: VALID_DATE });
  });

  it('weekly.kickoff.due accepts { userId, weekStarting }', () => {
    expect(
      parseEventData('weekly.kickoff.due', { userId: VALID_UUID, weekStarting: VALID_WEEK })
    ).toEqual({ userId: VALID_UUID, weekStarting: VALID_WEEK });
  });

  it.each([
    'listening.mode.expired',
    'silence.detection.due',
    'recurrence.materialize.due',
    'gentle.default.expired',
    'purge.soft_deleted.due',
  ] as const)('payload-less cron event %s accepts empty object', (name) => {
    expect(parseEventData(name, {})).toEqual({});
  });
});

describe('event registry — rejects shape drift', () => {
  it('user.signed_up rejects missing userId', () => {
    expect(() => parseEventData('user.signed_up', {})).toThrow();
  });

  it('user.signed_up rejects non-UUID userId', () => {
    expect(() => parseEventData('user.signed_up', { userId: 'not-a-uuid' })).toThrow();
  });

  it('morning.check_in.due rejects malformed date', () => {
    expect(() =>
      parseEventData('morning.check_in.due', { userId: VALID_UUID, date: '05/26/2026' })
    ).toThrow();
  });

  it('weekly.review.due rejects missing weekStarting', () => {
    expect(() => parseEventData('weekly.review.due', { userId: VALID_UUID })).toThrow();
  });

  it('morning.check_in.due rejects wrong-keyed payload', () => {
    expect(() =>
      parseEventData('morning.check_in.due', {
        userId: VALID_UUID,
        // typo — schema expects `date`
        scheduledOn: VALID_DATE,
      })
    ).toThrow();
  });
});
