/**
 * Breadcrumb Component
 *
 * Displays the current navigation path based on the URL.
 * Automatically generates breadcrumbs from the path segments.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useBreadcrumbLabels } from '@/lib/contexts/BreadcrumbContext';

// Route labels for friendly names
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  settings: 'Configuración',
  general: 'General',
  users: 'Usuarios',
  profile: 'Perfil',
};

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const pathname = usePathname();
  const { labels } = useBreadcrumbLabels();

  // Split path and filter empty segments
  const segments = pathname.split('/').filter(Boolean);

  // If no segments (root) or only dashboard, show just Dashboard
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return (
      <nav className={cn('flex items-center gap-1 text-sm', className)}>
        <Home className="text-muted-foreground h-4 w-4" />
        <ChevronRight className="text-muted-foreground h-3 w-3" />
        <span className="text-foreground font-medium">Dashboard</span>
      </nav>
    );
  }

  // Build breadcrumb items
  const allItems = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    // Priority: context labels > static routeLabels > formatted segment
    const label =
      labels[segment] || routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  // Smart truncation logic
  // If > 4 items (Home + 3 segments), collapse middle items
  // e.g. Home > Users > 123 > Edit -> Home > ... > 123 > Edit
  let displayItems = allItems;
  let hasCollapsed = false;

  if (allItems.length > 3) {
    hasCollapsed = true;
    // Keep first item (e.g. Users), last 2 items (Parent + Current)
    const firstItem = allItems[0];
    const lastItems = allItems.slice(-2);
    displayItems = [firstItem, ...lastItems];
  }

  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)}>
      {/* Home link */}
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {hasCollapsed && (
        <div className="flex items-center gap-1">
          <ChevronRight className="text-muted-foreground h-3 w-3" />
          <span className="text-muted-foreground">...</span>
        </div>
      )}

      {/* Breadcrumb items */}
      {displayItems.map((item, index) => {
        // Disable links for specific segments that don't have pages
        const isClickable =
          !['settings'].includes(item.label.toLowerCase()) &&
          !['configuración'].includes(item.label.toLowerCase());

        const isFirst = index === 0;
        // On mobile: hide the first item (closest to home) when > 2 items
        const hideOnMobile = isFirst && displayItems.length > 2;

        return (
          <div key={item.href} className="contents">
            {/* Mobile-only ellipsis replacing first item */}
            {hideOnMobile && (
              <div className="text-muted-foreground flex items-center gap-1 md:hidden">
                <ChevronRight className="text-muted-foreground h-3 w-3" />
                <span>…</span>
              </div>
            )}
            <div className={cn('flex items-center gap-1', hideOnMobile && 'hidden md:flex')}>
              <ChevronRight className="text-muted-foreground h-3 w-3" />
              {item.isLast || !isClickable ? (
                <span
                  className={cn(
                    'font-medium sm:max-w-none',
                    item.isLast ? 'text-foreground max-w-[150px] truncate' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground dropdown-transition whitespace-nowrap"
                >
                  {item.label}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
