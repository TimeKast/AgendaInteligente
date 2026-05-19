'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface UserPagerProps {
  prev: { id: string; humanId: string; name: string | null; email: string } | null;
  next: { id: string; humanId: string; name: string | null; email: string } | null;
  currentIndex: number;
  total: number;
}

/**
 * CRM-style pager for navigating between users.
 * Compact grouped control: [ ‹  2 de 5  › ]
 */
export function UserNavigator({ prev, next, currentIndex, total }: UserPagerProps) {
  if (total <= 1) return null;

  return (
    <div className="neo-outset-sm flex items-center rounded-lg">
      {/* Prev button */}
      {prev ? (
        <Link
          href={`/settings/users/${prev.humanId}`}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-l-lg p-2 transition-colors"
          title={`Anterior: ${prev.name || prev.email}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="cursor-default rounded-l-lg p-2 opacity-20">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {/* Counter */}
      <span className="text-muted-foreground px-2 text-xs tabular-nums select-none">
        {currentIndex} de {total}
      </span>

      {/* Next button */}
      {next ? (
        <Link
          href={`/settings/users/${next.humanId}`}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-r-lg p-2 transition-colors"
          title={`Siguiente: ${next.name || next.email}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="cursor-default rounded-r-lg p-2 opacity-20">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
