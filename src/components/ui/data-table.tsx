/**
 * DataTable Component
 *
 * "Batteries included" wrapper that composes the modular table system:
 * - useTableState hook for state management
 * - Table component for rendering
 * - TableSearch for filtering
 * - TablePagination for navigation
 *
 * For more control, use the individual components directly.
 *
 * @example
 * <DataTable
 *   data={users}
 *   columns={[
 *     { id: 'name', header: 'Nombre', accessor: 'name', sortable: true },
 *     { id: 'email', header: 'Email', accessor: 'email' },
 *   ]}
 *   searchableColumns={['name', 'email']}
 *   pageSize={10}
 * />
 */

'use client';

import { Table, TableColumn } from './table';
import { TableSearch, TablePagination } from './table-extras';
import { useTableState } from '@/lib/hooks/useTableState';
import { cn } from '@/lib/utils/cn';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DataTableProps<T extends object> {
  /** Data to display */
  data: T[];
  /** Column definitions (same as Table component) */
  columns: TableColumn<T>[];
  /** Key extractor for rows */
  keyExtractor: (row: T) => string | number;
  /** Columns to search (keys from T) */
  searchableColumns?: (keyof T)[];
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Items per page */
  pageSize?: number;
  /** Show search input */
  showSearch?: boolean;
  /** Show pagination */
  showPagination?: boolean;
  /** Always show pagination even with 1 page */
  alwaysShowPagination?: boolean;
  /** Show page size selector in footer (default: true) */
  showPageSizeSelector?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom icon for empty state */
  emptyIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Optional action for empty state */
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  /** Title for the table header */
  title?: string;
  /** Description for the table header */
  description?: string;
  /** Action buttons slot */
  actions?: React.ReactNode;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Optional className for the container */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  data,
  columns,
  keyExtractor,
  searchableColumns = [],
  searchPlaceholder = 'Buscar...',
  pageSize = 10,
  showSearch = true,
  showPagination = true,
  alwaysShowPagination = false,
  showPageSizeSelector = true,
  emptyMessage = 'No hay datos para mostrar',
  emptyIcon,
  emptyAction,
  title,
  description,
  actions,
  onRowClick,
  className,
}: DataTableProps<T>) {
  // Use the centralized table state hook
  const tableState = useTableState({
    data,
    searchableColumns,
    pageSize,
  });

  return (
    <div className={cn('neo-outset bg-card overflow-hidden rounded-xl', className)}>
      {/* Header with title, search, and actions */}
      {(title || showSearch || actions) && (
        <div className="border-muted-foreground/10 flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Title & Description */}
          <div className="flex-1">
            {title && <h2 className="text-foreground font-semibold">{title}</h2>}
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            {showSearch && searchableColumns.length > 0 && (
              <TableSearch
                value={tableState.filters.search}
                onChange={tableState.setSearch}
                placeholder={searchPlaceholder}
                className="w-full sm:w-64"
              />
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Scrollable table area */}
      <div className="scrollbar-visible overflow-x-auto">
        <Table
          columns={columns}
          data={tableState.paginatedData}
          keyExtractor={keyExtractor}
          emptyMessage={emptyMessage}
          emptyIcon={emptyIcon}
          emptyAction={emptyAction}
          onRowClick={onRowClick}
          sorting={{
            onSort: tableState.onSort,
            getSortDirection: tableState.getSortDirection,
          }}
          className="neo-flat rounded-none"
        />
      </div>

      {/* Pagination */}
      {showPagination && (
        <TablePagination
          page={tableState.page}
          totalPages={tableState.totalPages}
          onPageChange={tableState.setPage}
          totalItems={tableState.filteredData.length}
          pageSize={tableState.pageSize}
          onPageSizeChange={showPageSizeSelector ? tableState.setPageSize : undefined}
          alwaysShow={alwaysShowPagination}
        />
      )}
    </div>
  );
}
