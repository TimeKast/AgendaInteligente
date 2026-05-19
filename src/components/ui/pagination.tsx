import { cn } from '@/lib/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Number of page buttons to show */
  siblingCount?: number;
  className?: string;
}

/**
 * Generate page numbers to display
 */
function getPageNumbers(current: number, total: number, siblings: number): (number | 'dots')[] {
  const pages: (number | 'dots')[] = [];

  // Always show first page
  pages.push(1);

  const leftSibling = Math.max(2, current - siblings);
  const rightSibling = Math.min(total - 1, current + siblings);

  // Add dots if there's a gap after first page
  if (leftSibling > 2) {
    pages.push('dots');
  }

  // Add middle pages
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== total) {
      pages.push(i);
    }
  }

  // Add dots if there's a gap before last page
  if (rightSibling < total - 1) {
    pages.push('dots');
  }

  // Always show last page if more than 1 page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}

/**
 * Pagination component for navigating through pages
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages, siblingCount);

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)}>
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="neo-outset-sm text-muted-foreground disabled:neo-flat hover:neo-inset-sm active:neo-inset rounded-lg p-2 transition-all disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === 'dots' ? (
          <span key={`dots-${i}`} className="text-muted-foreground px-2">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'min-w-10 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              page === currentPage
                ? 'neo-inset-sm text-primary font-bold'
                : 'neo-outset-sm text-foreground hover:neo-inset-sm active:neo-inset'
            )}
          >
            {page}
          </button>
        )
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="neo-outset-sm text-muted-foreground disabled:neo-flat hover:neo-inset-sm active:neo-inset rounded-lg p-2 transition-all disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}
