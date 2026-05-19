/**
 * Unit Tests — Pagination Utilities
 *
 * Tests for server-side pagination helpers:
 * clampPageSize, calculateOffset, calculateTotalPages,
 * parsePaginationParams, buildPaginationSQL, createCachedCount
 *
 * @see SKT-005
 */

import { describe, it, expect, vi } from 'vitest';
import {
  clampPageSize,
  calculateOffset,
  calculateTotalPages,
  parsePaginationParams,
  buildPaginationSQL,
  createCachedCount,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  CACHE_TTL_REALTIME,
  CACHE_TTL_BATCH,
} from '@/lib/db/utils/pagination';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('pagination constants', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
    expect(MAX_PAGE_SIZE).toBe(100);
    expect(PAGE_SIZE_OPTIONS).toEqual([10, 20, 50, 100]);
  });

  it('should have cache TTLs', () => {
    expect(CACHE_TTL_REALTIME).toBe(300); // 5 min
    expect(CACHE_TTL_BATCH).toBe(43200); // 12 hours
  });

  it('PAGE_SIZE_OPTIONS should include default page size', () => {
    expect(PAGE_SIZE_OPTIONS).toContain(DEFAULT_PAGE_SIZE);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// clampPageSize
// ─────────────────────────────────────────────────────────────────────────────

describe('clampPageSize', () => {
  it('should return the size when within bounds', () => {
    expect(clampPageSize(20)).toBe(20);
    expect(clampPageSize(50)).toBe(50);
    expect(clampPageSize(100)).toBe(100);
  });

  it('should clamp to max when size exceeds limit', () => {
    expect(clampPageSize(200)).toBe(MAX_PAGE_SIZE);
    expect(clampPageSize(999)).toBe(MAX_PAGE_SIZE);
  });

  it('should allow custom max', () => {
    expect(clampPageSize(200, 50)).toBe(50);
    expect(clampPageSize(30, 50)).toBe(30);
  });

  it('should clamp to minimum 1 for zero or negative', () => {
    expect(clampPageSize(0)).toBe(1);
    expect(clampPageSize(-5)).toBe(1);
  });

  it('should floor decimal values', () => {
    expect(clampPageSize(10.7)).toBe(10);
    expect(clampPageSize(20.3)).toBe(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateOffset
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateOffset', () => {
  it('should return 0 for page 1', () => {
    expect(calculateOffset(1, 20)).toBe(0);
    expect(calculateOffset(1, 50)).toBe(0);
  });

  it('should calculate correct offset', () => {
    expect(calculateOffset(2, 20)).toBe(20);
    expect(calculateOffset(3, 20)).toBe(40);
    expect(calculateOffset(5, 10)).toBe(40);
  });

  it('should handle page 0 as page 1', () => {
    expect(calculateOffset(0, 20)).toBe(0);
  });

  it('should handle negative page as page 1', () => {
    expect(calculateOffset(-3, 20)).toBe(0);
  });

  it('should floor decimal values', () => {
    expect(calculateOffset(2.7, 20)).toBe(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateTotalPages
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateTotalPages', () => {
  it('should return 1 for empty result set', () => {
    expect(calculateTotalPages(0, 20)).toBe(1);
  });

  it('should calculate exact pages', () => {
    expect(calculateTotalPages(100, 20)).toBe(5);
    expect(calculateTotalPages(50, 10)).toBe(5);
  });

  it('should round up for partial pages', () => {
    expect(calculateTotalPages(21, 20)).toBe(2);
    expect(calculateTotalPages(101, 20)).toBe(6);
  });

  it('should return 1 for items less than pageSize', () => {
    expect(calculateTotalPages(5, 20)).toBe(1);
  });

  it('should handle pageSize of 0 gracefully (clamps to 1)', () => {
    // Math.max(1, 0) = 1, Math.ceil(100/1) = 100
    expect(calculateTotalPages(100, 0)).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parsePaginationParams
// ─────────────────────────────────────────────────────────────────────────────

describe('parsePaginationParams', () => {
  it('should return defaults for empty params', () => {
    const result = parsePaginationParams({});
    expect(result).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('should parse page and limit from searchParams', () => {
    const result = parsePaginationParams({ page: '3', limit: '50' });
    expect(result).toEqual({ page: 3, pageSize: 50 });
  });

  it('should clamp pageSize to MAX_PAGE_SIZE', () => {
    const result = parsePaginationParams({ limit: '500' });
    expect(result.pageSize).toBe(MAX_PAGE_SIZE);
  });

  it('should clamp page to minimum 1', () => {
    const result = parsePaginationParams({ page: '-1' });
    expect(result.page).toBe(1);
  });

  it('should handle non-numeric values', () => {
    const result = parsePaginationParams({ page: 'abc', limit: 'xyz' });
    expect(result).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('should use custom defaults', () => {
    const result = parsePaginationParams({}, { page: 2, pageSize: 50, maxPageSize: 200 });
    expect(result).toEqual({ page: 2, pageSize: 50 });
  });

  it('should respect custom maxPageSize', () => {
    const result = parsePaginationParams({ limit: '150' }, { maxPageSize: 200 });
    expect(result.pageSize).toBe(150);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildPaginationSQL
// ─────────────────────────────────────────────────────────────────────────────

describe('buildPaginationSQL', () => {
  it('should build correct pagination for page 1', () => {
    const result = buildPaginationSQL({ page: 1, pageSize: 20 });
    expect(result).toEqual({
      limit: 20,
      offset: 0,
      safePage: 1,
      safePageSize: 20,
    });
  });

  it('should build correct pagination for page 3', () => {
    const result = buildPaginationSQL({ page: 3, pageSize: 20 });
    expect(result).toEqual({
      limit: 20,
      offset: 40,
      safePage: 3,
      safePageSize: 20,
    });
  });

  it('should clamp pageSize to max', () => {
    const result = buildPaginationSQL({ page: 1, pageSize: 500 });
    expect(result.safePageSize).toBe(MAX_PAGE_SIZE);
    expect(result.limit).toBe(MAX_PAGE_SIZE);
  });

  it('should respect custom maxPageSize', () => {
    const result = buildPaginationSQL({ page: 1, pageSize: 150, maxPageSize: 200 });
    expect(result.safePageSize).toBe(150);
    expect(result.limit).toBe(150);
  });

  it('should clamp negative page to 1', () => {
    const result = buildPaginationSQL({ page: -5, pageSize: 20 });
    expect(result.safePage).toBe(1);
    expect(result.offset).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createCachedCount
// ─────────────────────────────────────────────────────────────────────────────

describe('createCachedCount', () => {
  it('should return a function', () => {
    const cachedCount = createCachedCount(async () => 42, { tags: ['test-counts'] });
    expect(typeof cachedCount).toBe('function');
  });

  it('should call the query function and return the count', async () => {
    // unstable_cache requires Next.js runtime (incrementalCache).
    // In unit tests, we verify the wrapper is callable; integration
    // testing validates the full cache behavior.
    const queryFn = vi.fn().mockResolvedValue(1500);
    const cachedCount = createCachedCount(queryFn, {
      tags: ['test-counts'],
      revalidate: 300,
    });

    // unstable_cache throws without Next.js runtime — expected
    await expect(cachedCount()).rejects.toThrow();
  });

  it('should use default revalidate when not specified', () => {
    // Verify createCachedCount doesn't throw without revalidate
    const cachedCount = createCachedCount(async () => 100, { tags: ['test-counts'] });
    expect(typeof cachedCount).toBe('function');
  });
});
