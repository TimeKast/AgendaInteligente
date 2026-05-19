/**
 * TableFilter Component
 *
 * Dropdown filter for tables with single or multi-select options.
 * Uses Radix Popover for accessible dropdown behavior.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
  color?: string; // Optional color (hex) for backwards compatibility
  dotClassName?: string; // Tailwind class for dot color (e.g. "bg-blue-500")
}

export interface TableFilterProps<T extends string = string> {
  /** Stable id for trigger/content linkage (prevents hydration id mismatch) */
  id?: string;
  /** Filter label */
  label: string;
  /** Available options */
  options: FilterOption<T>[];
  /** Currently selected value(s) */
  value: T | T[];
  /** onChange handler */
  onChange: (value: T | T[]) => void;
  /** Single or multi select mode */
  mode?: 'single' | 'multi';
  /** Placeholder when nothing selected */
  placeholder?: string;
  /** Optional className */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TableFilter<T extends string = string>({
  id,
  label,
  options,
  value,
  onChange,
  mode = 'single',
  placeholder = 'Todos',
  className,
}: TableFilterProps<T>) {
  const [open, setOpen] = useState(false);

  // Close popover on scroll to prevent it floating over the header
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [open]);

  // Normalize value to array for multi-select
  const selectedValues = useMemo(() => {
    if (mode === 'multi') {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    return value ? [value as T] : [];
  }, [value, mode]);

  // Get display text
  const displayText = useMemo(() => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (mode === 'multi') {
      return `${selectedValues.length} seleccionados`;
    }
    const selected = options.find((opt) => opt.value === selectedValues[0]);
    return selected?.label || placeholder;
  }, [selectedValues, options, mode, placeholder]);

  // Toggle option selection
  const toggleOption = (optionValue: T) => {
    if (mode === 'single') {
      onChange(optionValue === value ? ('' as T) : optionValue);
      setOpen(false);
    } else {
      const newValues = selectedValues.includes(optionValue)
        ? (selectedValues.filter((v) => v !== optionValue) as T[])
        : ([...selectedValues, optionValue] as T[]);
      onChange(newValues);
    }
  };

  // Select all (multi mode only)
  const selectAll = () => {
    if (mode === 'multi') {
      onChange(options.map((opt) => opt.value) as T[]);
    }
  };

  // Clear selection
  const clearSelection = () => {
    onChange(mode === 'multi' ? ([] as T[]) : ('' as T));
    if (mode === 'single') setOpen(false);
  };

  const hasSelection = selectedValues.length > 0;
  const stableContentId = id ?? `table-filter-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Label */}
      <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </label>

      {/* Dropdown */}
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger
          aria-controls={stableContentId}
          className={cn(
            'neo-outset-sm flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-all outline-none',
            'bg-background hover:neo-outset',
            hasSelection ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            id={stableContentId}
            align="start"
            sideOffset={4}
            className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 neo-float z-50 w-(--radix-popover-trigger-width) min-w-48 origin-top-left rounded-xl border-none py-1"
          >
            {/* Multi-select actions */}
            {mode === 'multi' && (
              <div className="border-muted-foreground/10 flex items-center justify-between border-b px-3 py-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-primary text-xs hover:underline"
                >
                  Seleccionar todos
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                  Limpiar
                </button>
              </div>
            )}

            {/* Options */}
            <div className="max-h-60 overflow-y-auto py-1">
              {/* "Todos" option for single select */}
              {mode === 'single' && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm transition-all',
                    'hover:bg-accent/50 hover:neo-inset-sm',
                    !hasSelection && 'bg-primary/10'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      !hasSelection
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/50'
                    )}
                  >
                    {!hasSelection && <Check className="h-3 w-3" />}
                  </span>
                  <span className={!hasSelection ? 'text-foreground' : 'text-muted-foreground'}>
                    {placeholder}
                  </span>
                </button>
              )}

              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-all',
                      'hover:bg-accent/50 hover:neo-inset-sm',
                      isSelected && 'bg-primary/10'
                    )}
                  >
                    {/* Checkbox/Radio indicator */}
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        mode === 'multi' ? 'rounded' : 'rounded-full',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/50'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>

                    {/* Option label with optional color/dot */}
                    <span className="flex items-center gap-2">
                      {(option.color || option.dotClassName) && (
                        <span
                          className={cn('h-2 w-2 rounded-full', option.dotClassName)}
                          style={option.color ? { backgroundColor: option.color } : undefined}
                        />
                      )}
                      <span className={isSelected ? 'text-foreground' : 'text-muted-foreground'}>
                        {option.label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TableFilterBar - Container for multiple filters
// ─────────────────────────────────────────────────────────────────────────────

import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableFilterBarProps {
  /** Search input component */
  search?: React.ReactNode;
  /** Action buttons (e.g. New, Export) */
  actions?: React.ReactNode;
  /** Filter-related actions (e.g. clear filters) — shown next to filter toggle on mobile */
  filterActions?: React.ReactNode;
  /** Dropdown filters to be rendered inline or collapsed */
  filters?: React.ReactNode;
  /** Number of active filters to show in the badge */
  activeFilterCount?: number;
  /** Breakpoint where filters collapse into a toggle button (default: md) */
  collapseBreakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'always' | 'never';
  className?: string;
}

/**
 * Container for table filters, search, and actions.
 *
 * Desktop: search + filters inline in one row, actions right-aligned.
 * Mobile: search full-width, filter icon toggle + actions, collapsed filters below.
 *
 * @example
 * ```tsx
 * <TableFilterBar
 *   search={<TableSearch value={search} onChange={setSearch} placeholder="Buscar..." />}
 *   filters={
 *     <>
 *       <TableFilter label="Rol" options={roleOptions} ... />
 *       <TableFilter label="Estado" options={statusOptions} ... />
 *     </>
 *   }
 *   actions={<Button><Plus className="h-4 w-4" /> Agregar</Button>}
 *   activeFilterCount={2}
 *   collapseBreakpoint="md"
 * />
 * ```
 */
export function TableFilterBar({
  search,
  actions,
  filterActions,
  filters,
  activeFilterCount = 0,
  collapseBreakpoint = 'md',
  className,
}: TableFilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const bClasses = {
    sm: { toggle: 'block sm:hidden', inline: 'hidden sm:flex' },
    md: { toggle: 'block md:hidden', inline: 'hidden md:flex' },
    lg: { toggle: 'block lg:hidden', inline: 'hidden lg:flex' },
    xl: { toggle: 'block xl:hidden', inline: 'hidden xl:flex' },
    '2xl': { toggle: 'block 2xl:hidden', inline: 'hidden 2xl:flex' },
    always: { toggle: 'block', inline: 'hidden' },
    never: { toggle: 'hidden', inline: 'flex' },
  }[collapseBreakpoint];

  return (
    <div className={cn('mb-4 flex flex-col gap-4', className)}>
      {/* Top Row — wraps on mobile; search gets full width, buttons flow to next line */}
      <div className="flex w-full flex-wrap items-end gap-2 lg:gap-3">
        {/* 1. Search — full width on mobile, constrained on sm+ */}
        {search && <div className="w-full sm:w-auto sm:max-w-xs">{search}</div>}

        {/* 2. Filter toggle + filter actions (only visible when filters are collapsed) */}
        {(filters || filterActions) && (
          <div className="flex shrink-0 items-end gap-2">
            {filters && (
              <div className={cn('shrink-0', bClasses.toggle)}>
                <Button
                  type="button"
                  variant={filtersOpen ? 'outline' : 'neo'}
                  size="icon"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="relative h-9 w-9 shrink-0 p-0"
                  title="Filtros"
                >
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="bg-destructive absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white shadow-(--neo-outset-sm)">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>
            )}
            {/* Clear filters — only when collapsed (toggle visible) */}
            {filterActions && (
              <div className={cn('shrink-0', bClasses.toggle)}>{filterActions}</div>
            )}
          </div>
        )}

        {/* 3. Inline Filters (next to search on desktop) */}
        {filters && (
          <div
            className={cn(
              'shrink-0 flex-wrap items-end gap-2 *:flex-1 sm:*:max-w-50 sm:*:min-w-35 sm:*:flex-none lg:gap-3',
              bClasses.inline
            )}
          >
            {filters}
          </div>
        )}

        {/* 4. Spacer → pushes actions to the right */}
        <div className="flex-1" />

        {/* 5. Actions */}
        {actions && <div className="flex shrink-0 items-end gap-2">{actions}</div>}
      </div>

      {/* Collapsed Filters Row (mobile only) */}
      {filters && filtersOpen && (
        <div
          className={cn(
            'neo-inset-sm mt-1 grid grid-cols-2 gap-3 rounded-xl p-3 sm:flex sm:flex-wrap',
            '*:min-w-0 sm:*:max-w-60 sm:*:min-w-40 sm:*:flex-none',
            collapseBreakpoint === 'always'
              ? 'grid sm:flex'
              : collapseBreakpoint === 'never'
                ? 'hidden'
                : collapseBreakpoint === '2xl'
                  ? '2xl:hidden'
                  : collapseBreakpoint === 'xl'
                    ? 'xl:hidden'
                    : collapseBreakpoint === 'lg'
                      ? 'lg:hidden'
                      : collapseBreakpoint === 'md'
                        ? 'md:hidden'
                        : 'sm:hidden'
          )}
        >
          {filters}
        </div>
      )}
    </div>
  );
}
