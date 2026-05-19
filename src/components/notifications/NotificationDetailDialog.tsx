'use client';

/**
 * NotificationDetailDialog — Modal to view full notification content
 *
 * Used from both the dropdown panel (compact click) and the
 * notifications page (full card click). Shows full body text,
 * type badge, category, timestamp, and action buttons.
 *
 * @see NOTIF-009
 */

import { Bell, Settings, Shield, ExternalLink, Check, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NOTIFICATION_CATEGORIES } from '@/config/notifications';

// =============================================================================
// Types
// =============================================================================

interface NotificationDetailDialogProps {
  /** The notification to display, or null to close */
  notification: {
    id: string;
    title: string;
    body: string;
    type: string;
    category: string;
    url?: string | null;
    read: boolean;
    createdAt: string;
  } | null;
  /** Close handler */
  onClose: () => void;
  /** Mark as read handler */
  onRead?: (id: string) => void;
  /** Delete handler */
  onDelete?: (id: string) => void;
}

// =============================================================================
// Constants
// =============================================================================

const ICON_MAP: Record<string, typeof Bell> = {
  Settings,
  Shield,
  Bell,
};

// =============================================================================
// Helpers
// =============================================================================

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// Component
// =============================================================================

export function NotificationDetailDialog({
  notification,
  onClose,
  onRead,
  onDelete,
}: NotificationDetailDialogProps) {
  if (!notification) return null;

  const { id, title, body, category, url, read, createdAt } = notification;
  const categoryConfig = NOTIFICATION_CATEGORIES[category];
  const badgeVariant = categoryConfig?.badgeVariant || 'default';
  const CatIcon = (categoryConfig && ICON_MAP[categoryConfig.icon]) || Bell;

  const handleMarkRead = () => {
    onRead?.(id);
    onClose();
  };

  const handleDelete = () => {
    onDelete?.(id);
    onClose();
  };

  const handleNavigate = () => {
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} role="presentation" />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-background neo-float w-full max-w-md rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-detail-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-muted-foreground/10 flex items-start justify-between border-b px-5 py-4">
            <div className="flex items-center gap-3">
              <CatIcon className="text-muted-foreground h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <h2 id="notif-detail-title" className="text-foreground text-base font-semibold">
                  {title}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={badgeVariant} size="sm">
                    {categoryConfig?.label || category}
                  </Badge>
                  {!read && <span className="bg-primary h-2 w-2 rounded-full" />}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="mx-4 my-3 rounded-xl p-4 shadow-(--neo-inset-sm)">
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {body || 'Sin contenido adicional.'}
            </p>
            <p className="text-muted-foreground mt-3 text-xs">{formatDateTime(createdAt)}</p>
          </div>

          {/* Footer actions */}
          <div className="border-muted-foreground/10 flex items-center justify-between border-t px-5 py-3">
            <div className="flex items-center gap-2">
              {!read && onRead && (
                <Button type="button" variant="secondary" size="sm" onClick={handleMarkRead}>
                  <Check className="h-4 w-4" />
                  Marcar leída
                </Button>
              )}
              {url && (
                <Button type="button" variant="secondary" size="sm" onClick={handleNavigate}>
                  <ExternalLink className="h-4 w-4" />
                  Ir al enlace
                </Button>
              )}
            </div>
            {onDelete && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
