'use client';

/**
 * UserActivityLog Component
 *
 * Paginated audit log for a specific user.
 * Shows event cards with timestamp, type, and metadata.
 * Uses client-side pagination with loading skeleton.
 *
 * @see SK-003
 */

import { useState, useEffect, useCallback } from 'react';
import { LogIn, LogOut, KeyRound, UserPlus, Shield, FileText, type LucideIcon } from 'lucide-react';
import { getUserActivity, type AuditLogItem } from '@/lib/actions/audit';
import { Pagination } from '@/components/ui/pagination';

// =============================================================================
// Types
// =============================================================================

interface UserActivityLogProps {
  userId: string;
}

// =============================================================================
// Event Display Config
// =============================================================================

const EVENT_CONFIG: Record<
  string,
  { label: string; styles: { text: string; bg: string; icon: string }; Icon: LucideIcon }
> = {
  login_success: {
    label: 'Inicio de sesión',
    styles: {
      text: 'text-badge-emerald-text',
      bg: 'bg-badge-emerald-bg',
      icon: 'text-badge-emerald-dot',
    },
    Icon: LogIn,
  },
  login_failure: {
    label: 'Login fallido',
    styles: { text: 'text-badge-red-text', bg: 'bg-badge-red-bg', icon: 'text-badge-red-dot' },
    Icon: LogIn,
  },
  logout: {
    label: 'Cierre de sesión',
    styles: {
      text: 'text-badge-slate-text',
      bg: 'bg-badge-slate-bg',
      icon: 'text-badge-slate-dot',
    },
    Icon: LogOut,
  },
  password_reset_request: {
    label: 'Reset de contraseña solicitado',
    styles: {
      text: 'text-badge-amber-text',
      bg: 'bg-badge-amber-bg',
      icon: 'text-badge-amber-dot',
    },
    Icon: KeyRound,
  },
  password_changed: {
    label: 'Contraseña cambiada',
    styles: { text: 'text-badge-blue-text', bg: 'bg-badge-blue-bg', icon: 'text-badge-blue-dot' },
    Icon: KeyRound,
  },
  account_created: {
    label: 'Cuenta creada',
    styles: {
      text: 'text-badge-purple-text',
      bg: 'bg-badge-purple-bg',
      icon: 'text-badge-purple-dot',
    },
    Icon: UserPlus,
  },
  role_changed: {
    label: 'Rol cambiado',
    styles: { text: 'text-badge-pink-text', bg: 'bg-badge-pink-bg', icon: 'text-badge-pink-dot' },
    Icon: Shield,
  },
};

function getEventDisplay(event: string) {
  return (
    EVENT_CONFIG[event] || {
      label: event,
      styles: {
        text: 'text-badge-slate-text',
        bg: 'bg-badge-slate-bg',
        icon: 'text-badge-slate-dot',
      },
      Icon: FileText,
    }
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function ActivitySkeleton() {
  return (
    <div className="neo-outset bg-background rounded-xl p-6">
      <div className="bg-muted mb-4 h-5 w-36 rounded" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="neo-outset-sm bg-background animate-pulse rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="bg-muted h-4 w-32 rounded" />
                <div className="bg-muted h-3 w-24 rounded" />
              </div>
              <div className="bg-muted h-4 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="neo-inset-sm mb-4 rounded-xl p-4">
        <FileText className="text-muted-foreground h-8 w-8" />
      </div>
      <p className="text-foreground font-medium">Sin actividad</p>
      <p className="text-muted-foreground mt-1 text-sm">
        No hay eventos registrados para este usuario.
      </p>
    </div>
  );
}

// =============================================================================
// Event Card
// =============================================================================

function EventCard({ event }: { event: AuditLogItem }) {
  const display = getEventDisplay(event.event);
  const IconComponent = display.Icon;

  return (
    <div className="neo-outset-sm bg-background rounded-xl p-4 transition-all hover:shadow-(--neo-outset)">
      <div className="flex items-center gap-3">
        {/* Circular icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${display.styles.bg}`}
        >
          <IconComponent className={`h-4.5 w-4.5 ${display.styles.icon}`} />
        </div>

        {/* Event name + date */}
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-medium">{display.label}</p>
          <p className="text-muted-foreground text-xs">{formatDate(event.timestamp)}</p>
        </div>

        {/* Time */}
        <span className="text-muted-foreground shrink-0 text-sm">
          {formatTime(event.timestamp)}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

const PAGE_SIZE = 20;

export function UserActivityLog({ userId }: UserActivityLogProps) {
  const [data, setData] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchActivity = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const result = await getUserActivity(userId, targetPage, PAGE_SIZE);
        setData(result.data);
        setTotal(result.total);
        setPage(result.page);
      } catch (error) {
        console.error('[UserActivityLog] Failed to fetch activity:', error);
        setData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchActivity(1);
  }, [fetchActivity]);

  function handlePageChange(newPage: number) {
    fetchActivity(newPage);
  }

  // Loading state
  if (isLoading && data.length === 0) {
    return <ActivitySkeleton />;
  }

  // Empty state
  if (!isLoading && data.length === 0) {
    return <EmptyActivity />;
  }

  return (
    <div className="neo-outset bg-background rounded-xl p-6">
      {/* Section header */}
      <h3 className="text-foreground mb-4 font-semibold">Actividad Reciente</h3>

      {/* Events list */}
      <div className="relative space-y-3">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/50 dark:bg-black/30">
            <div className="text-muted-foreground text-sm">Cargando...</div>
          </div>
        )}
        {data.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Footer: count + pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {total} evento{total !== 1 ? 's' : ''}
        </p>
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  );
}
