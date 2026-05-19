'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { navigation, getBottomNavItems } from '@/config/navigation';
import { BottomNavMoreSheet } from './BottomNavMoreSheet';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { isNotificationsEnabled } from '@/lib/env';

interface BottomNavProps {
  userRole?: string;
}

export function BottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const notificationsEnabled = isNotificationsEnabled();
  const { unreadCount } = useNotifications();

  const tabs = getBottomNavItems(navigation, userRole);

  const isActive = useCallback(
    (href: string) => {
      if (href === '/dashboard') return pathname === '/dashboard';
      if (!pathname.startsWith(href)) return false;
      // Only active if no other tab has a more specific match
      return !tabs.some(
        (t) => t.href !== href && t.href.startsWith(href) && pathname.startsWith(t.href)
      );
    },
    [pathname, tabs]
  );

  const handleMoreClose = useCallback(() => {
    setMoreOpen(false);
  }, []);

  const showMoreBadge = notificationsEnabled && unreadCount > 0;
  const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <>
      <nav
        className="neo-outset-sm fixed inset-x-0 bottom-0 z-40 flex items-center justify-around px-2 lg:hidden"
        style={{
          backgroundColor: 'var(--card)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.bottomNavHref || tab.href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-2xl px-3 py-1 transition-all',
                  active && 'neo-inset-sm'
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="truncate text-[10px] leading-tight font-medium">
                {tab.bottomNavLabel || tab.name}
              </span>
            </Link>
          );
        })}

        {/* "Más" button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="text-muted-foreground relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 transition-colors"
        >
          <span className="relative flex items-center justify-center rounded-2xl px-3 py-1">
            <LayoutGrid className="h-5 w-5" />
            {showMoreBadge && (
              <span
                className={cn(
                  'bg-destructive text-destructive-foreground ring-card absolute -top-1.5 -right-2 z-10 flex items-center justify-center rounded-full text-[9px] leading-none font-bold shadow-(--neo-outset-sm) ring-2',
                  unreadCount > 9 ? 'h-4 min-w-4 px-0.5' : 'h-4 w-4'
                )}
              >
                {badgeText}
              </span>
            )}
          </span>
          <span className="truncate text-[10px] leading-tight font-medium">Más</span>
        </button>
      </nav>

      <BottomNavMoreSheet open={moreOpen} onClose={handleMoreClose} userRole={userRole} />
    </>
  );
}
