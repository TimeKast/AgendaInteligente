'use client';

/**
 * NotificationItem — Atomic notification UI component
 *
 * Two variants:
 * - `compact`: single-line for dropdown panel (title + truncated body)
 * - `full`: card for dedicated page (full body, checkbox, actions)
 *
 * @see NOTIF-009
 */

import { useRouter } from 'next/navigation';
import { Settings, Shield, Bell, Trash2, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { NeoCheckbox } from '@/components/ui/neo-checkbox';
import { NOTIFICATION_CATEGORIES, type NotificationType } from '@/config/notifications';

// =============================================================================
// Types
// =============================================================================

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  category: string;
  url?: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationItemProps {
  /** Notification data */
  notification: NotificationData;
  /** Display variant */
  variant: 'compact' | 'full';
  /** Callback when notification is clicked (e.g. open detail) */
  onClick?: (notification: NotificationData) => void;
  /** Callback when notification is marked as read */
  onRead?: (id: string) => void;
  /** Callback when notification is deleted */
  onDelete?: (id: string) => void;
  /** Whether selection mode is active */
  selectable?: boolean;
  /** Whether this item is selected */
  selected?: boolean;
  /** Callback when selection changes */
  onSelect?: (id: string) => void;
}

// =============================================================================
// Constants
// =============================================================================

/** Map Lucide icon string names to actual components */
const ICON_MAP: Record<string, typeof Bell> = {
  Settings,
  Shield,
  Bell,
};

/** Border-left color by notification type — removed for cleaner UI */
// Keeping only the badge variant map

/** Badge variant is now driven by category — see NOTIFICATION_CATEGORIES.badgeVariant */

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format a timestamp as relative time (e.g. "hace 5 min", "hace 2 h").
 * Uses native Intl.RelativeTimeFormat — no date-fns needed.
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  if (diffHour < 24) return rtf.format(-diffHour, 'hour');
  if (diffDay < 30) return rtf.format(-diffDay, 'day');

  return date.toLocaleDateString('es', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Renders the Lucide icon for a notification category.
 * Defined as a static component outside render to satisfy React Compiler.
 */
function CategoryIcon({ categoryId, className }: { categoryId: string; className?: string }) {
  const cat = NOTIFICATION_CATEGORIES[categoryId];
  const Icon = (cat && ICON_MAP[cat.icon]) || Bell;
  return <Icon className={className} />;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Atomic notification item component.
 *
 * @example
 * ```tsx
 * <NotificationItem
 *   notification={notif}
 *   variant="compact"
 *   onRead={(id) => markAsRead(id)}
 * />
 * ```
 */
export function NotificationItem({
  notification,
  variant,
  onClick,
  onRead,
  onDelete,
  selectable,
  selected,
  onSelect,
}: NotificationItemProps) {
  const router = useRouter();

  const { id, title, body, category, url, read, createdAt } = notification;
  const categoryConfig = NOTIFICATION_CATEGORIES[category];
  const badgeVariant = categoryConfig?.badgeVariant || 'default';

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleClick = () => {
    // Open detail dialog if handler provided
    if (onClick) {
      onClick(notification);
      return;
    }

    // Fallback: mark as read + navigate
    if (!read && onRead) {
      onRead(id);
    }
    if (url) {
      router.push(url);
    }
  };

  // ── Compact Variant ───────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
          'hover:shadow-(--neo-inset-sm)',
          read && 'opacity-60'
        )}
      >
        {/* Category Icon */}
        <CategoryIcon categoryId={category} className="text-muted-foreground h-5 w-5 shrink-0" />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('truncate text-sm', !read && 'text-card-foreground font-medium')}>
              {title}
            </span>
            {!read && <span className="bg-primary h-2 w-2 shrink-0 rounded-full" />}
          </div>
          <p className="text-muted-foreground truncate text-xs">{body}</p>
        </div>

        {/* Timestamp */}
        <span className="text-muted-foreground shrink-0 text-xs">
          {formatRelativeTime(createdAt)}
        </span>
      </button>
    );
  }

  // ── Full Variant ─────────────────────────────────────────────────────
  return (
    <>
      <div
        className={cn(
          'group flex w-full cursor-pointer items-start gap-3 rounded-xl p-4 shadow-(--neo-outset-sm) transition-all duration-300',
          read && 'opacity-70',
          selected && 'bg-primary/5 ring-primary/20 ring-1'
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleClick();
        }}
      >
        {/* NeoCheckbox (selection mode) */}
        {selectable && (
          <div className="mt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <NeoCheckbox checked={!!selected} onChange={() => onSelect?.(id)} />
          </div>
        )}

        {/* Category Icon with unread dot overlay */}
        {/* Category Icon + unread dot stacked vertically */}
        <div className="mt-0.5 flex shrink-0 flex-col items-center gap-1.5">
          <CategoryIcon categoryId={category} className="text-muted-foreground h-5 w-5" />
          {!read ? (
            <span className="bg-primary h-2 w-2 rounded-full" />
          ) : (
            <span className="h-2 w-2" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm', !read && 'text-card-foreground font-medium')}>
              {title}
            </span>
            <Badge variant={badgeVariant} size="sm">
              {categoryConfig?.label || category}
            </Badge>
          </div>

          <p className="text-muted-foreground mt-1 text-sm">{body}</p>

          <div className="mt-2 flex items-center gap-2">
            <span
              className="text-muted-foreground text-xs"
              title={new Date(createdAt).toLocaleString('es', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            >
              {formatRelativeTime(createdAt)}
            </span>
          </div>
        </div>

        {/* Hover-reveal actions */}
        <div className="flex shrink-0 items-center gap-1 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
          {/* Mark as read */}
          {!read && onRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRead(id);
              }}
              className="text-muted-foreground hover:text-primary rounded-lg p-1.5 transition-all hover:shadow-(--neo-inset-sm)"
              aria-label="Marcar como leída"
              title="Marcar leída"
            >
              <Check className="h-4 w-4" />
            </button>
          )}

          {/* Navigate button */}
          {url && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!read && onRead) onRead(id);
                router.push(url);
              }}
              className="text-muted-foreground hover:text-card-foreground rounded-lg p-1.5 transition-all hover:shadow-(--neo-inset-sm)"
              aria-label="Ir a notificación"
              title="Ir →"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {/* Delete button (no confirmation) */}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="text-destructive hover:text-destructive rounded-lg p-1.5 transition-all hover:shadow-(--neo-inset-sm)"
              aria-label="Eliminar notificación"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
