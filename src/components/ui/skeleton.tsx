import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton loading placeholder
 * Used for content loading states
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('bg-muted animate-pulse rounded-md', className)} />;
}

/**
 * Text skeleton with multiple lines
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  );
}

/**
 * Card skeleton for dashboard cards
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-card neo-outset rounded-2xl p-6', className)}>
      <Skeleton className="mb-4 h-4 w-1/3" />
      <Skeleton className="mb-2 h-8 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Table skeleton for data tables
 */
export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('neo-outset rounded-2xl p-4', className)}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
