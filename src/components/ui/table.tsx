import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { SortDirection } from '@/lib/hooks/useTableState';
import { EmptyState } from '@/components/common/EmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TableColumn<T> {
  /** Column unique identifier (for sorting) */
  id?: string;
  /** Column header */
  header: string;
  /** Key to access data or render function */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** Optional className for the column */
  className?: string;
  /** Whether this column is sortable */
  sortable?: boolean;
}

export interface TableProps<T> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Data rows */
  data: T[];
  /** Key extractor for rows */
  keyExtractor: (row: T) => string | number;
  /** Optional className for the table */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom icon for empty state */
  emptyIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Optional action for empty state */
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  /** On row click handler */
  onRowClick?: (row: T) => void;
  /** Sorting props (optional) */
  sorting?: {
    onSort: (column: string) => void;
    getSortDirection: (column: string) => SortDirection | null;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort Indicator
// ─────────────────────────────────────────────────────────────────────────────

function SortIndicator({ direction }: { direction: SortDirection | null }) {
  if (!direction) {
    return (
      <span className="text-muted-foreground ml-1 inline-flex flex-col opacity-0 group-hover:opacity-50">
        <ChevronUp className="-mb-1 h-3 w-3" />
        <ChevronDown className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span className="text-primary ml-1">
      {direction === 'asc' ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Table Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Responsive data table component with optional sorting
 *
 * @example
 * // Basic usage
 * <Table columns={columns} data={data} keyExtractor={(row) => row.id} />
 *
 * @example
 * // With sorting (use with useTableState)
 * const tableState = useTableState({ data, searchableColumns: ['name'] });
 * <Table
 *   columns={columns}
 *   data={tableState.paginatedData}
 *   keyExtractor={(row) => row.id}
 *   sorting={{
 *     onSort: tableState.onSort,
 *     getSortDirection: tableState.getSortDirection,
 *   }}
 * />
 */
export function Table<T>({
  columns,
  data,
  keyExtractor,
  className,
  emptyMessage = 'No hay datos',
  emptyIcon,
  emptyAction,
  onRowClick,
  sorting,
}: TableProps<T>) {
  const getCellValue = (row: T, accessor: TableColumn<T>['accessor']): React.ReactNode => {
    if (typeof accessor === 'function') {
      return accessor(row);
    }
    const value = row[accessor];
    return value as React.ReactNode;
  };

  const getColumnId = (col: TableColumn<T>, index: number): string => {
    if (col.id) return col.id;
    if (typeof col.accessor === 'string') return col.accessor as string;
    return `col-${index}`;
  };

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        icon={emptyIcon}
        action={emptyAction}
        className={className}
      />
    );
  }

  return (
    <div className={cn('neo-outset rounded-2xl border-(--table-border)', className)}>
      <table className="w-full min-w-125">
        <thead>
          <tr className="border-muted-foreground/10 relative z-10 border-b bg-(--table-header-bg) shadow-(--neo-outset-sm)">
            {columns.map((col, i) => {
              const columnId = getColumnId(col, i);
              const isSortable = col.sortable && sorting;
              const sortDirection = isSortable ? sorting.getSortDirection(columnId) : null;

              return (
                <th
                  key={columnId}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold tracking-wider text-(--table-header-foreground) uppercase',
                    isSortable && 'group cursor-pointer select-none',
                    col.className
                  )}
                  onClick={isSortable ? () => sorting.onSort(columnId) : undefined}
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {isSortable && <SortIndicator direction={sortDirection} />}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-(--table-border) bg-(--table-row-bg) transition-all hover:bg-(--table-row-hover)',
                onRowClick && 'cursor-pointer hover:shadow-(--neo-inset-sm)',
                rowIndex < data.length - 1 && 'border-muted-foreground/10 border-b'
              )}
            >
              {columns.map((col, i) => (
                <td
                  key={getColumnId(col, i)}
                  className={cn('text-foreground px-4 py-3 text-sm', col.className)}
                >
                  {getCellValue(row, col.accessor)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
