'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { branding } from '@/config/branding';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils/cn';
import { useMounted } from '@/lib/hooks/useMounted';
import { navigation, filterNavigationByRole } from '@/config/navigation';

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [expandedSections, setExpandedSections] = useState<string[]>(['Configuración']);
  const mounted = useMounted();

  // Get theme-aware logos
  const currentTheme = mounted ? resolvedTheme : 'light';
  const clientLogo = branding.getClientLogo(currentTheme);
  const timeKastLogo = branding.getTimeKastLogo('full', currentTheme);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const toggleSection = (name: string) => {
    setExpandedSections((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <aside
      className="neo-outset fixed top-0 left-0 z-40 flex h-screen w-60 flex-col"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
      }}
    >
      {/* Top: Client Branding (matches header height) */}
      <div className="border-muted-foreground/10 flex h-16 shrink-0 items-center justify-center border-b px-4">
        {clientLogo ? (
          <div className="relative h-12 w-full max-w-45">
            <Image
              src={clientLogo}
              alt={branding.appName}
              fill
              priority
              className="object-contain"
              sizes="180px"
            />
          </div>
        ) : (
          <span className="text-lg font-bold" style={{ color: 'var(--sidebar-foreground)' }}>
            {branding.appName}
          </span>
        )}
      </div>

      {/* Middle: Navigation (scrollable) */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filterNavigationByRole(navigation, userRole).map((item) => {
          return (
            <div key={item.name}>
              {item.collapsible ? (
                <>
                  {/* Collapsible section */}
                  <button
                    onClick={() => toggleSection(item.name)}
                    className={cn(
                      'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors'
                    )}
                    style={{ color: 'var(--sidebar-foreground)' }}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5 shrink-0" />
                      {item.name}
                    </div>
                    {expandedSections.includes(item.name) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {/* Submenu items */}
                  {expandedSections.includes(item.name) && item.children && (
                    <div className="mt-1 ml-8 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'flex items-center rounded-lg px-3 py-1.5 text-sm transition-all',
                            isActive(child.href)
                              ? 'neo-inset-sm font-medium'
                              : 'hover:shadow-(--neo-outset-sm)'
                          )}
                          style={{
                            color: isActive(child.href)
                              ? 'var(--sidebar-active-foreground)'
                              : 'var(--sidebar-foreground)',
                          }}
                        >
                          <child.icon className="mr-2 h-4 w-4 shrink-0" />
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Regular link */
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive(item.href) ? 'neo-inset-sm' : 'hover:shadow-(--neo-outset-sm)'
                  )}
                  style={{
                    color: isActive(item.href)
                      ? 'var(--sidebar-active-foreground)'
                      : 'var(--sidebar-foreground)',
                  }}
                >
                  <item.icon className="mr-3 h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-muted-foreground/10 shrink-0 border-t px-4 py-3">
        <div className="flex justify-center">
          <div className="relative h-7 w-full max-w-25">
            <Image
              src={timeKastLogo}
              alt="TimeKast"
              fill
              className="object-contain opacity-70"
              sizes="100px"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
