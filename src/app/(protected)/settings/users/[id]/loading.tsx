import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the User Detail page.
 *
 * Mirrors the layout of UserDetailPage:
 * - Avatar + name + email (header)
 * - Role + status badges + navigator
 * - Tabs placeholder (2 tabs + content area)
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      {/* Header: Avatar + Name */}
      <div className="space-y-3">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {/* Badges + Navigator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Tabs placeholder */}
      <div className="space-y-4">
        <div className="flex gap-4 border-b pb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
        {/* Tab content placeholder */}
        <div className="space-y-4">
          <SkeletonText lines={4} />
        </div>
      </div>
    </div>
  );
}
