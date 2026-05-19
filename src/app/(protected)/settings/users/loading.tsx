import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the Users list page.
 *
 * Mirrors the layout of AdminUsersPage:
 * - container + header (h1 + subtitle)
 * - DataTable with 5 placeholder rows
 */
export default function Loading() {
  return (
    <div className="container mx-auto space-y-4 py-6">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
      {/* Search bar placeholder */}
      <Skeleton className="h-10 w-64" />
      {/* DataTable skeleton */}
      <SkeletonTable rows={5} />
    </div>
  );
}
