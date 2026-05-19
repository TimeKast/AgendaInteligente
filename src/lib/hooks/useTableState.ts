'use client';

import { useState, useMemo, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

/**
 * Toggles sort direction through 3 states: null → asc → desc → null
 */
export function toggleSortDirection(current: SortDirection): SortDirection {
  switch (current) {
    case null:
      return 'asc';
    case 'asc':
      return 'desc';
    case 'desc':
      return null;
  }
}

export interface FilterState {
  search: string;
  columns: Record<string, string>;
}

export interface TableStateOptions<T extends object> {
  data: T[];
  initialSort?: SortState;
  searchableColumns?: (keyof T)[];
  pageSize?: number;
}

export interface TableState<T> {
  // Data
  data: T[];
  filteredData: T[];
  paginatedData: T[];

  // Sorting
  sort: SortState;
  onSort: (column: string) => void;
  getSortDirection: (column: string) => SortDirection | null;

  // Filtering
  filters: FilterState;
  setSearch: (search: string) => void;
  setColumnFilter: (column: string, value: string) => void;
  clearFilters: () => void;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // Column visibility
  visibleColumns: Set<string>;
  toggleColumn: (column: string) => void;
  showColumn: (column: string) => void;
  hideColumn: (column: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages table state: sorting, filtering, pagination, and column visibility
 *
 * @example
 * const { paginatedData, sort, onSort, setSearch } = useTableState({
 *   data: users,
 *   searchableColumns: ['name', 'email'],
 *   pageSize: 10,
 * });
 */
export function useTableState<T extends object>({
  data,
  initialSort = { column: null, direction: null },
  searchableColumns = [],
  pageSize: initialPageSize = 20,
}: TableStateOptions<T>): TableState<T> {
  // State
  const [sort, setSort] = useState<SortState>(initialSort);
  const [filters, setFilters] = useState<FilterState>({ search: '', columns: {} });
  const [page, setPageRaw] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());

  // Reset page to 1 when external data changes (parent filters before passing)
  const [prevDataLength, setPrevDataLength] = useState(data.length);
  if (prevDataLength !== data.length) {
    setPrevDataLength(data.length);
    setPageRaw(1);
  }

  // Filtered data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (filters.search && searchableColumns.length > 0) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((item) =>
        searchableColumns.some((col) => {
          const value = item[col];
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply column filters
    Object.entries(filters.columns).forEach(([column, value]) => {
      if (value) {
        result = result.filter((item) =>
          String((item as Record<string, unknown>)[column])
            .toLowerCase()
            .includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sort.column) {
      const column = sort.column;
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[column];
        const bVal = (b as Record<string, unknown>)[column];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sort.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters, sort, searchableColumns]);

  // Calculate total pages (minimum 1) and clamp current page
  const totalPages = Math.max(1, Math.ceil(filteredData.length / currentPageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);

  // Paginated data uses clamped page
  const paginatedData = useMemo(() => {
    const start = (clampedPage - 1) * currentPageSize;
    return filteredData.slice(start, start + currentPageSize);
  }, [filteredData, clampedPage, currentPageSize]);

  // Page size change handler
  const handleSetPageSize = useCallback((newSize: number) => {
    setCurrentPageSize(newSize);
    setPageRaw(1);
  }, []);

  // Sorting handler: 3-state cycle (null → asc → desc → null)
  const onSort = useCallback((column: string) => {
    setSort((prev) => {
      if (prev.column === column) {
        // Same column: cycle to next state
        const newDirection = toggleSortDirection(prev.direction);
        return {
          column: newDirection ? column : null,
          direction: newDirection,
        };
      } else {
        // Different column: start with asc
        return { column, direction: 'asc' };
      }
    });
    setPageRaw(1);
  }, []);

  const getSortDirection = useCallback(
    (column: string): SortDirection | null => {
      return sort.column === column ? sort.direction : null;
    },
    [sort]
  );

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPageRaw(1);
  }, []);

  const setColumnFilter = useCallback((column: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      columns: { ...prev.columns, [column]: value },
    }));
    setPageRaw(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', columns: {} });
    setPageRaw(1);
  }, []);

  const nextPage = useCallback(() => {
    setPageRaw((p: number) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPageRaw((p: number) => Math.max(p - 1, 1));
  }, []);

  const toggleColumn = useCallback((column: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  }, []);

  const showColumn = useCallback((column: string) => {
    setVisibleColumns((prev) => new Set(prev).add(column));
  }, []);

  const hideColumn = useCallback((column: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      next.delete(column);
      return next;
    });
  }, []);

  return {
    data,
    filteredData,
    paginatedData,
    sort,
    onSort,
    getSortDirection,
    filters,
    setSearch,
    setColumnFilter,
    clearFilters,
    page: clampedPage,
    pageSize: currentPageSize,
    totalPages,
    setPage: setPageRaw,
    setPageSize: handleSetPageSize,
    nextPage,
    prevPage,
    visibleColumns,
    toggleColumn,
    showColumn,
    hideColumn,
  };
}
