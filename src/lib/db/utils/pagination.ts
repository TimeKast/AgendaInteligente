/**
 * Server-Side Pagination Utilities
 *
 * Provides helpers for server-side pagination, cached counts,
 * and large table support (100K+ rows).
 *
 * @example
 * ```ts
 * // In a server action:
 * const result = await createPaginatedQuery({
 *   db,
 *   table: clients,
 *   page: 1,
 *   pageSize: 20,
 *   where: eq(clients.branchId, branchId),
 *   orderBy: [asc(clients.name)],
 * });
 * // → { data: Client[], total: number, page: number, pageSize: number }
 * ```
 *
 * @see .claude/skills/sk-crud-scaffold/SKILL.md — Server-Side Pagination pattern
 * @see SKT-005
 */

import { unstable_cache } from 'next/cache';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default items per page */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum allowed page size (prevents abuse) */
export const MAX_PAGE_SIZE = 100;

/** Available page size options for UI selectors */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/** Default cache TTL for realtime tables (5 minutes) */
export const CACHE_TTL_REALTIME = 300;

/** Cache TTL for batch-only tables (12 hours) */
export const CACHE_TTL_BATCH = 43200;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  /** Page data */
  data: T[];
  /** Total count of all matching records */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

export interface PaginatedQueryOptions {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page (clamped to MAX_PAGE_SIZE) */
  pageSize: number;
  /** Maximum allowed page size override (default: MAX_PAGE_SIZE) */
  maxPageSize?: number;
}

export interface CachedCountOptions {
  /**
   * Cache tags for invalidation via `revalidateTag()`.
   * @example ['client-counts', 'branch-123-counts']
   */
  tags: string[];
  /**
   * Cache TTL in seconds.
   * - **Realtime tables (default):** 300 (5 min) — safe for tables with constant writes
   * - **Batch-only tables:** 43200 (12h) — only if table is updated via cron/feed
   *
   * @default 300
   */
  revalidate?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clamp page size to a maximum value.
 *
 * Ensures the page size is at least 1 and at most `max`.
 * Prevents clients from requesting excessively large pages.
 *
 * @param size - Requested page size
 * @param max - Maximum allowed (default: MAX_PAGE_SIZE)
 * @returns Clamped page size
 */
export function clampPageSize(size: number, max: number = MAX_PAGE_SIZE): number {
  return Math.max(1, Math.min(Math.floor(size), max));
}

/**
 * Calculate SQL OFFSET from page number and page size.
 *
 * @param page - Current page (1-indexed)
 * @param pageSize - Items per page
 * @returns OFFSET value for SQL query
 */
export function calculateOffset(page: number, pageSize: number): number {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  return (safePage - 1) * safePageSize;
}

/**
 * Calculate total number of pages.
 *
 * @param totalItems - Total count of items
 * @param pageSize - Items per page
 * @returns Total pages (minimum 1)
 */
export function calculateTotalPages(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
}

/**
 * Parse and validate pagination params from URL search params.
 *
 * Reads `page` and `limit` from search params, validates bounds,
 * and returns safe values. Use in server components or server actions.
 *
 * @param searchParams - URL search params object
 * @param defaults - Default values
 * @returns Validated { page, pageSize }
 *
 * @example
 * ```ts
 * // In a server component:
 * export default async function ListPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
 *   const params = await searchParams;
 *   const { page, pageSize } = parsePaginationParams(params);
 *   const result = await getItems({ page, pageSize });
 * }
 * ```
 */
export function parsePaginationParams(
  searchParams: Record<string, string | string[] | undefined>,
  defaults?: { page?: number; pageSize?: number; maxPageSize?: number }
): { page: number; pageSize: number } {
  const defaultPage = defaults?.page ?? 1;
  const defaultPageSize = defaults?.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxPageSize = defaults?.maxPageSize ?? MAX_PAGE_SIZE;

  const rawPage = searchParams.page;
  const rawLimit = searchParams.limit;

  const page = Math.max(1, parseInt(String(rawPage ?? defaultPage), 10) || defaultPage);
  const pageSize = clampPageSize(
    parseInt(String(rawLimit ?? defaultPageSize), 10) || defaultPageSize,
    maxPageSize
  );

  return { page, pageSize };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cached Count
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a cached count function using Next.js `unstable_cache`.
 *
 * Wraps a count query function with caching + revalidation tags.
 * The returned function caches the result for the configured TTL
 * and can be invalidated via `revalidateTag()`.
 *
 * **Strategy by table type:**
 *
 * | Volume  | Updates      | revalidate | Invalidation              |
 * |---------|-------------|------------|---------------------------|
 * | <10K    | Realtime    | 0 (none)   | Direct COUNT(*) — no cache |
 * | 10K-100K| Realtime    | 300 (5min) | revalidateTag on write    |
 * | 100K+   | Realtime    | 300 (5min) | revalidateTag on write    |
 * | 100K+   | Batch/Cron  | 43200 (12h)| revalidateTag post-cron   |
 *
 * @example
 * ```ts
 * // Define the cached count (module-level)
 * const getClientCount = createCachedCount(
 *   async () => {
 *     const [{ total }] = await db.select({ total: count() }).from(clients);
 *     return total;
 *   },
 *   { tags: ['client-counts'], revalidate: 300 }
 * );
 *
 * // Use in a server action
 * const total = await getClientCount();
 *
 * // Invalidate after mutations
 * import { revalidateTag } from 'next/cache';
 * revalidateTag('client-counts');
 * ```
 *
 * @param queryFn - Async function that returns the count
 * @param options - Cache tags and TTL
 * @returns Cached async function that returns the count
 */
export function createCachedCount(
  queryFn: () => Promise<number>,
  options: CachedCountOptions
): () => Promise<number> {
  const { tags, revalidate = CACHE_TTL_REALTIME } = options;

  return unstable_cache(
    async () => {
      return queryFn();
    },
    tags,
    { tags, revalidate }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Paginated Query Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build LIMIT/OFFSET SQL fragments for a paginated query.
 *
 * This is a low-level helper that returns SQL fragments you can
 * append to any Drizzle query. For a higher-level approach, see
 * the `createPaginatedQuery` pattern in crud-scaffold.md.
 *
 * @example
 * ```ts
 * const { page, pageSize } = parsePaginationParams(searchParams);
 * const { limit, offset, safePage, safePageSize } = buildPaginationSQL({ page, pageSize });
 *
 * const data = await db
 *   .select()
 *   .from(clients)
 *   .where(notDeleted(clients))
 *   .orderBy(asc(clients.name))
 *   .limit(safePageSize)
 *   .offset(offset);
 *
 * const total = await getCachedClientCount();
 *
 * return {
 *   data,
 *   total,
 *   page: safePage,
 *   pageSize: safePageSize,
 *   totalPages: calculateTotalPages(total, safePageSize),
 * };
 * ```
 */
export function buildPaginationSQL(options: PaginatedQueryOptions): {
  /** SQL LIMIT value */
  limit: number;
  /** SQL OFFSET value */
  offset: number;
  /** Validated page number */
  safePage: number;
  /** Validated page size */
  safePageSize: number;
} {
  const maxPageSize = options.maxPageSize ?? MAX_PAGE_SIZE;
  const safePageSize = clampPageSize(options.pageSize, maxPageSize);
  const safePage = Math.max(1, Math.floor(options.page));
  const offset = calculateOffset(safePage, safePageSize);

  return {
    limit: safePageSize,
    offset,
    safePage,
    safePageSize,
  };
}
