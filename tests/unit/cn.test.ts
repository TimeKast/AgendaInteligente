/**
 * Unit Tests — cn utility
 *
 * Tests for the Tailwind CSS class merging utility
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils/cn';

describe('cn (class name utility)', () => {
  it('should merge simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;

    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('should dedupe conflicting Tailwind classes', () => {
    // tailwind-merge should keep only the last one
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('should filter out falsy values', () => {
    expect(cn('foo', null, undefined, false, '', 'bar')).toBe('foo bar');
  });

  it('should handle objects (clsx format)', () => {
    expect(cn({ active: true, disabled: false, hidden: true })).toBe('active hidden');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });
});
