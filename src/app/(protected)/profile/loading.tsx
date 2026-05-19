import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the Profile page.
 *
 * Mirrors the real layout:
 * - h1 + subtitle
 * - Neomorphic TabsList (`rounded-2xl p-2 bg-background neo-outset-sm`) with
 *   2 trigger placeholders (Perfil + Notificaciones)
 * - One generic content card — we don't know which tab the user will land
 *   on (server can't read the search param's tab without re-rendering),
 *   so a single placeholder card avoids the form↔matrix swap flash
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-5 w-80" />
      </div>

      {/* TabsList — matches real component (cva default variant) */}
      <div className="bg-background neo-outset-sm flex w-full items-center justify-center gap-1 rounded-2xl p-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>

      {/* Tab content placeholder — generic, agnostic of which tab loads */}
      <div className="neo-outset-sm space-y-4 rounded-xl p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    </div>
  );
}
