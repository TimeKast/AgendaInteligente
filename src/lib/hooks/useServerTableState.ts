'use client';

/**
 * Server-Side Table State Hook
 *
 * For tables with large datasets where pagination/sorting
 * should be handled server-side via URL params.
 *
 * @see useTableState for client-side tables (<100 rows)
 * @see src/lib/db/utils/pagination.ts for server-side query helpers
 */

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { toggleSortDirection, type SortDirection } from './useTableState';

// Re-export pagination constants for consumer convenience
export { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/db/utils/pagination';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ServerTableParams {
  /** Column being sorted */
  sort: string | null;
  /** Sort direction */
  dir: SortDirection;
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
}

export interface ServerTableState extends ServerTableParams {
  /** Toggle sort for a column (3-state cycle) */
  setSort: (column: string) => void;
  /** Navigate to a specific page */
  setPage: (page: number) => void;
  /** Change items per page (persisted in URL as `limit` param) */
  setPageSize: (size: number) => void;
  /** Get sort direction for a column */
  getSortDirection: (column: string) => SortDirection;
}

export interface UseServerTableStateOptions {
  /** Default sort column */
  defaultSort?: string | null;
  /** Default sort direction */
  defaultDir?: SortDirection;
  /** Default page */
  defaultPage?: number;
  /** Default limit (items per page) */
  defaultLimit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages server-side table state via URL search params
 *
 * @example
 * ```tsx
 * const { sort, dir, page, limit, setSort, setPage } = useServerTableState({
 *   defaultLimit: 20,
 * });
 *
 * // Fetch data with these params
 * const { data, totalCount } = await getUsers({ sort, dir, page, limit });
 * ```
 */
export function useServerTableState(options: UseServerTableStateOptions = {}): ServerTableState {
  const { defaultSort = null, defaultDir = null, defaultPage = 1, defaultLimit = 20 } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse state from URL
  const state = useMemo<ServerTableParams>(() => {
    const sortParam = searchParams.get('sort');
    const dirParam = searchParams.get('dir') as 'asc' | 'desc' | null;
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    return {
      sort: sortParam ?? defaultSort,
      dir: dirParam ?? defaultDir,
      page: pageParam ? parseInt(pageParam, 10) : defaultPage,
      limit: limitParam ? parseInt(limitParam, 10) : defaultLimit,
    };
  }, [searchParams, defaultSort, defaultDir, defaultPage, defaultLimit]);

  // Update URL params helper
  const updateParams = useCallback(
    (updates: Partial<ServerTableParams>) => {
      const params = new URLSearchParams(searchParams);

      // Handle sort
      if ('sort' in updates) {
        if (updates.sort) {
          params.set('sort', updates.sort);
        } else {
          params.delete('sort');
        }
      }

      // Handle dir
      if ('dir' in updates) {
        if (updates.dir) {
          params.set('dir', updates.dir);
        } else {
          params.delete('dir');
        }
      }

      // Handle page
      if ('page' in updates) {
        if (updates.page && updates.page > 1) {
          params.set('page', String(updates.page));
        } else {
          params.delete('page'); // Don't show page=1 in URL
        }
      }

      // Handle limit
      if ('limit' in updates && updates.limit !== defaultLimit) {
        params.set('limit', String(updates.limit));
      }

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [searchParams, router, pathname, defaultLimit]
  );

  // Sort handler: 3-state cycle
  const setSort = useCallback(
    (column: string) => {
      if (state.sort === column) {
        // Same column: cycle to next state
        const newDir = toggleSortDirection(state.dir);
        updateParams({
          sort: newDir ? column : null,
          dir: newDir,
          page: 1, // Reset to first page on sort change
        });
      } else {
        // Different column: start with asc
        updateParams({
          sort: column,
          dir: 'asc',
          page: 1,
        });
      }
    },
    [state.sort, state.dir, updateParams]
  );

  // Page handler
  const setPage = useCallback(
    (page: number) => {
      updateParams({ page });
    },
    [updateParams]
  );

  // Page size handler — persists in URL as `limit` param
  const setPageSize = useCallback(
    (size: number) => {
      updateParams({ limit: size, page: 1 }); // Reset to page 1 on size change
    },
    [updateParams]
  );

  // Get sort direction for a column
  const getSortDirection = useCallback(
    (column: string): SortDirection => {
      return state.sort === column ? state.dir : null;
    },
    [state.sort, state.dir]
  );

  return {
    ...state,
    setSort,
    setPage,
    setPageSize,
    getSortDirection,
  };
}
