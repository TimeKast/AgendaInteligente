'use client';

/**
 * NotificationBell — Bell icon with badge counter
 *
 * Positioned in Header between theme toggle and avatar.
 * Consumes `useNotifications()` for real-time unread count.
 *
 * forwardRef + props spread so it can be used as `<PopoverTrigger asChild>`
 * (Radix injects ref, aria-expanded, data-state).
 *
 * @see NOTIF-010
 */

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useNotifications } from '@/lib/hooks/useNotifications';

export interface NotificationBellProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export const NotificationBell = React.forwardRef<HTMLButtonElement, NotificationBellProps>(
  function NotificationBell({ className, ...props }, ref) {
    const { unreadCount } = useNotifications();
    const [animate, setAnimate] = useState(false);
    const prevCountRef = useRef(unreadCount);

    useEffect(() => {
      if (unreadCount > prevCountRef.current) {
        // eslint-disable-next-line
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 300);
        return () => clearTimeout(timer);
      }
      prevCountRef.current = unreadCount;
    }, [unreadCount]);

    const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);

    return (
      <button
        ref={ref}
        type="button"
        className={cn('neo-interactive relative overflow-visible rounded-full p-2', className)}
        aria-label={unreadCount > 0 ? `Notificaciones: ${unreadCount} sin leer` : 'Notificaciones'}
        {...props}
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span
            className={cn(
              'bg-destructive text-destructive-foreground absolute -top-1 -right-1 z-10 flex items-center justify-center rounded-full text-[10px] leading-none font-bold shadow-sm',
              unreadCount > 9 ? 'h-4.5 min-w-4.5 px-1' : 'h-4.5 w-4.5',
              animate && 'animate-bounce-in'
            )}
          >
            {badgeText}
          </span>
        )}
      </button>
    );
  }
);
