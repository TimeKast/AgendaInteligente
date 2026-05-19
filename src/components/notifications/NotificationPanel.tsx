'use client';

/**
 * NotificationPanel — Popover panel that appears on NotificationBell click
 *
 * Uses Radix Popover (portal to body, focus trap, click-outside, escape — free).
 * Shows up to 6 most recent notifications, with header (title + mark-all-read)
 * and footer (view all + settings).
 *
 * Click on a notification opens the detail modal.
 * Inline "✓" button marks as read without opening detail.
 *
 * @see NOTIF-011
 */

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Check, Settings, Shield } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { NOTIFICATION_CATEGORIES, type NotificationType } from '@/config/notifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationBell } from './NotificationBell';
import { NotificationDetailDialog } from './NotificationDetailDialog';
import type { NotificationData } from './NotificationItem';

/**
 * Maximum number of notifications shown in the dropdown before truncating.
 * The list container ships with `max-h-96 overflow-y-auto`, so when more
 * than ~6 items render, internal scroll kicks in without growing the panel.
 * Past this cap the user navigates to `/notifications` for the full list.
 * Mirrored by the poll endpoint's `PAGE_SIZE`.
 */
const MAX_ITEMS = 20;

const ICON_MAP: Record<string, typeof Bell> = { Settings, Shield, Bell };

export function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetchNotifications,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [detailNotif, setDetailNotif] = useState<NotificationData | null>(null);

  const recentNotifications = notifications.slice(0, MAX_ITEMS);

  const handleNotificationClick = (notif: (typeof recentNotifications)[0]) => {
    const isUnread = !(notif.read ?? notif.isRead ?? false);
    if (isUnread) markAsRead(notif.id);
    setOpen(false);
    setDetailNotif({
      id: notif.id,
      title: notif.title,
      body: notif.body || '',
      type: notif.type as NotificationType,
      category: notif.category,
      url: notif.url,
      read: true,
      createdAt: notif.createdAt,
    });
  };

  const handleInlineMarkRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    markAsRead(id);
  };

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(o) => {
          if (o) refetchNotifications();
          setOpen(o);
        }}
      >
        <PopoverTrigger asChild>
          <NotificationBell />
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-80 p-0"
          aria-label="Panel de notificaciones"
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div className="border-muted-foreground/10 flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-foreground text-sm font-semibold">Notificaciones</h3>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-primary flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors hover:shadow-(--neo-inset-sm)"
              >
                <Check className="h-3 w-3" aria-hidden="true" />
                Leer todas
              </button>
            )}
          </div>

          {/* ── List ──────────────────────────────────────── */}
          {recentNotifications.length > 0 ? (
            <div className="max-h-96 space-y-0.5 overflow-y-auto p-2">
              {recentNotifications.map((notif) => {
                const isRead = notif.read ?? notif.isRead ?? false;
                return (
                  <div
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notif)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNotificationClick(notif);
                    }}
                    className="group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:shadow-(--neo-inset-sm)"
                    style={{ opacity: isRead ? 0.6 : 1 }}
                  >
                    {(() => {
                      const catConfig = NOTIFICATION_CATEGORIES[notif.category];
                      const CatIcon = (catConfig && ICON_MAP[catConfig.icon]) || Bell;
                      return (
                        <CatIcon
                          className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                      );
                    })()}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`truncate text-sm ${!isRead ? 'text-card-foreground font-medium' : ''}`}
                        >
                          {notif.title}
                        </span>
                        {!isRead && (
                          <>
                            <span
                              className="bg-primary h-2 w-2 shrink-0 rounded-full"
                              aria-hidden="true"
                            />
                            <span className="sr-only">Sin leer</span>
                          </>
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">{notif.body}</p>
                    </div>

                    {!isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleInlineMarkRead(e, notif.id)}
                        className="text-muted-foreground hover:text-primary shrink-0 rounded-lg p-1 opacity-0 transition-all group-hover:opacity-100 hover:shadow-(--neo-inset-sm)"
                        aria-label="Marcar como leída"
                        title="Marcar leída"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-8">
              <Bell className="text-muted-foreground h-8 w-8" aria-hidden="true" />
              <p className="text-muted-foreground text-sm">Sin notificaciones</p>
            </div>
          )}

          {/* ── Footer ─────────────────────────────────────── */}
          <div className="border-muted-foreground/10 flex items-center justify-between border-t px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-primary text-xs font-medium transition-colors hover:underline"
            >
              Ver todas{unreadCount > 0 ? ` (${unreadCount})` : ''} →
            </Link>

            <Link
              href="/profile?tab=notifications"
              onClick={() => setOpen(false)}
              className="text-muted-foreground rounded-lg p-1.5 transition-colors hover:shadow-(--neo-inset-sm)"
              aria-label="Configuración de notificaciones"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      <NotificationDetailDialog
        notification={detailNotif}
        onClose={() => setDetailNotif(null)}
        onRead={(id) => {
          markAsRead(id);
          setDetailNotif(null);
        }}
        onDelete={(id) => {
          deleteNotification(id);
          setDetailNotif(null);
        }}
      />
    </>
  );
}
