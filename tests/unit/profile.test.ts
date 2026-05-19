/**
 * Profile Validation Tests
 *
 * Unit tests for profile form validation schema.
 */

import { describe, it, expect } from 'vitest';
import { profileSchema } from '@/lib/validations/profile';

describe('profileSchema', () => {
  it('should accept valid name', () => {
    const result = profileSchema.safeParse({ name: 'John Doe' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
    }
  });

  it('should trim whitespace from name', () => {
    const result = profileSchema.safeParse({ name: '  John Doe  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
    }
  });

  it('should reject empty name', () => {
    const result = profileSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject whitespace-only name', () => {
    const result = profileSchema.safeParse({ name: '   ' });
    expect(result.success).toBe(false);
  });

  it('should reject name longer than 100 characters', () => {
    const longName = 'a'.repeat(101);
    const result = profileSchema.safeParse({ name: longName });
    expect(result.success).toBe(false);
  });

  it('should accept name with exactly 100 characters', () => {
    const name = 'a'.repeat(100);
    const result = profileSchema.safeParse({ name });
    expect(result.success).toBe(true);
  });
});
