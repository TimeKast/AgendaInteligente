'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { navigation, getMoreSheetItems, type NavItem } from '@/config/navigation';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { isNotificationsEnabled } from '@/lib/env';

interface BottomNavMoreSheetProps {
  open: boolean;
  onClose: () => void;
  userRole?: string;
}

export function BottomNavMoreSheet({ open, onClose, userRole }: BottomNavMoreSheetProps) {
  const pathname = usePathname();
  const items = getMoreSheetItems(navigation, userRole);
  const notificationsEnabled = isNotificationsEnabled();
  const { unreadCount } = useNotifications();

  const isActive = useCallback(
    (href: string) => {
      if (href === '/dashboard') return pathname === '/dashboard';
      return pathname.startsWith(href);
    },
    [pathname]
  );

  if (items.length === 0) return null;

  // Separate top-level items (no children) from grouped items (with children)
  const topLevel: NavItem[] = [];
  const grouped: NavItem[] = [];

  for (const item of items) {
    if (item.children && item.children.length > 0) {
      grouped.push(item);
    } else {
      topLevel.push(item);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="more-backdrop"
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="more-sheet"
            className="border-muted-foreground/10 fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t lg:hidden"
            style={{
              backgroundColor: 'var(--card)',
              boxShadow: 'var(--neo-float)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 300,
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="h-1 w-10 rounded-full"
                style={{ backgroundColor: 'var(--muted-foreground)', opacity: 0.3 }}
              />
            </div>

            <div
              className="space-y-4 px-4 pb-6"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {/* Top-level items (no children) */}
              {topLevel.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5">
                  {topLevel.map((item) => (
                    <NavItemLink
                      key={item.href}
                      item={item}
                      active={isActive(item.href)}
                      onClick={onClose}
                      showBadge={
                        notificationsEnabled &&
                        item.featureFlag === 'notifications' &&
                        unreadCount > 0
                      }
                      badgeCount={unreadCount}
                    />
                  ))}
                </div>
              )}

              {/* Grouped items (with children) */}
              {grouped.map((group) => (
                <div key={group.href}>
                  {/* Section header */}
                  <div className="text-muted-foreground mb-1.5 flex items-center gap-2 px-2 text-xs font-semibold tracking-wider uppercase">
                    <group.icon className="h-3.5 w-3.5" />
                    {group.name}
                  </div>
                  {/* Children grid */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {group.children!.map((child) => (
                      <NavItemLink
                        key={child.href}
                        item={child}
                        active={isActive(child.href)}
                        onClick={onClose}
                        showBadge={
                          notificationsEnabled &&
                          child.featureFlag === 'notifications' &&
                          unreadCount > 0
                        }
                        badgeCount={unreadCount}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Reusable nav link for the sheet grid */
function NavItemLink({
  item,
  active,
  onClick,
  showBadge,
  badgeCount = 0,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  showBadge?: boolean;
  badgeCount?: number;
}) {
  const Icon = item.icon;
  const badgeText = badgeCount > 9 ? '9+' : String(badgeCount);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all',
        active
          ? 'neo-inset-sm text-primary font-medium'
          : 'neo-outset-sm text-muted-foreground active:shadow-(--neo-pressed)'
      )}
    >
      <span className="relative">
        <Icon className="h-6 w-6" />
        {showBadge && (
          <span
            className={cn(
              'bg-destructive text-destructive-foreground ring-card absolute -top-1.5 -right-2.5 z-10 flex items-center justify-center rounded-full text-[9px] leading-none font-bold ring-2',
              badgeCount > 9 ? 'h-4 min-w-4 px-0.5' : 'h-4 w-4'
            )}
          >
            {badgeText}
          </span>
        )}
      </span>
      <span className="text-xs leading-tight">{item.name}</span>
    </Link>
  );
}
