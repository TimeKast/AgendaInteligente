'use client';

import { useState } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import * as PopoverPrimitive from '@radix-ui/react-popover';

// ─────────────────────────────────────────────────────────────────────────────
// TableSearch
// ─────────────────────────────────────────────────────────────────────────────

export interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Search input for table filtering
 */
export function TableSearch({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
}: TableSearchProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'neo-inset-sm w-full rounded-xl border-0 py-2 pr-10 pl-10 text-sm transition-shadow',
          'bg-background text-foreground',
          'placeholder:text-muted-foreground placeholder:italic',
          'focus:neo-inset focus:outline-none'
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TableToolbar
// ─────────────────────────────────────────────────────────────────────────────

export interface TableToolbarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Toolbar container for table actions (search, filters, buttons)
 */
export function TableToolbar({ children, className }: TableToolbarProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TablePagination
// ─────────────────────────────────────────────────────────────────────────────

import { Pagination } from './pagination';

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Show result count text */
  showResultCount?: boolean;
  /** Total items for result count display */
  totalItems?: number;
  /** Page size for result count display */
  pageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Always show pagination even with 1 page */
  alwaysShow?: boolean;
  className?: string;
}

/**
 * Table pagination wrapper that uses the base Pagination component
 */
export function TablePagination({
  page,
  totalPages,
  onPageChange,
  showResultCount = true,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  alwaysShow = false,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1 && !onPageSizeChange && !alwaysShow) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems || page * pageSize);

  return (
    <div
      className={cn(
        'relative z-10 flex flex-wrap items-center justify-between gap-2 overflow-visible px-4 py-3',
        'bg-(--table-header-bg) shadow-(--neo-outset-sm)',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {showResultCount && totalItems !== undefined ? (
          <p className="text-muted-foreground text-sm">
            Mostrando {startItem} - {endItem} de {totalItems}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Página {page} de {totalPages}
          </p>
        )}

        {/* Page size selector — Radix Popover */}
        {onPageSizeChange && (
          <PageSizeSelector
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          siblingCount={1}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PageSizeSelector (internal — Radix Popover)
// ─────────────────────────────────────────────────────────────────────────────

function PageSizeSelector({
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: {
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (size: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Por página:</span>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger className="neo-outset-sm text-muted-foreground flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm transition-all hover:shadow-(--neo-inset-sm)">
          <span>{pageSize}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="end"
            side="top"
            sideOffset={4}
            className="neo-float data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 w-20 origin-bottom-right rounded-xl bg-(--table-header-bg) py-1"
          >
            {pageSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  onPageSizeChange(size);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-all',
                  'hover:bg-accent/50 hover:neo-inset-sm',
                  size === pageSize
                    ? 'bg-primary/10 text-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    size === pageSize
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/50'
                  )}
                >
                  {size === pageSize && <Check className="h-3 w-3" />}
                </span>
                {size}
              </button>
            ))}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TableResultCount
// ─────────────────────────────────────────────────────────────────────────────

export interface TableResultCountProps {
  filtered: number;
  total: number;
  className?: string;
}

/**
 * Shows count of filtered results
 */
export function TableResultCount({ filtered, total, className }: TableResultCountProps) {
  if (filtered === total) {
    return (
      <p className={cn('text-muted-foreground text-sm', className)}>
        {total} {total === 1 ? 'resultado' : 'resultados'}
      </p>
    );
  }

  return (
    <p className={cn('text-muted-foreground text-sm', className)}>
      Mostrando {filtered} de {total} resultados
    </p>
  );
}
