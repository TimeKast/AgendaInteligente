'use client';

/**
 * Header Component
 *
 * App header with breadcrumb, theme toggle, notifications, and user menu.
 * Uses Radix DropdownMenu for all dropdowns.
 *
 * @see UXUI-006 — migrated from HeadlessUI to Radix
 */

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Sun, Moon, Eclipse, UserCircle, LogOut, Download, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils/cn';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { usePwaInstall } from '@/lib/pwa/usePwaInstall';
import { Avatar } from '@/components/ui/avatar';
import { useMounted } from '@/lib/hooks/useMounted';
import { isNotificationsEnabled } from '@/lib/env';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

import { NavigationControls } from './NavigationControls';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

type Theme = 'light' | 'midnight' | 'dark';

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'midnight', label: 'Medianoche', icon: Moon },
  { value: 'dark', label: 'Oscuro', icon: Eclipse },
];

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const notificationsEnabled = isNotificationsEnabled();
  const { unreadCount } = useNotifications();

  const currentTheme = (theme as Theme) || 'dark';

  return (
    <header
      className="bg-background neo-outset-sm fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between px-4 lg:left-60 lg:px-6"
      style={{
        backgroundColor: 'var(--header-bg)',
      }}
    >
      {/* Left: Nav Controls + Breadcrumb */}
      <div className="flex flex-1 items-center gap-1 overflow-hidden lg:gap-4">
        {/* Navigation Controls (Always visible) */}
        <NavigationControls />

        {/* Breadcrumb (Always visible, smart truncated) */}
        <div className="flex-1 overflow-hidden">
          <Breadcrumb className="whitespace-nowrap" />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-2 pl-2">
        {/* Desktop Theme Toggle (hidden on mobile) */}
        {mounted && (
          <div className="hidden md:block">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="text-foreground neo-interactive flex items-center gap-2 rounded-full p-2 outline-none">
                  {(() => {
                    const CurrentIcon = themes.find((t) => t.value === currentTheme)?.icon || Moon;
                    return <CurrentIcon className="h-5 w-5" />;
                  })()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {themes.map(({ value, label, icon: Icon }) => (
                  <DropdownMenuItem
                    key={value}
                    onSelect={() => setTheme(value)}
                    className={cn(
                      'flex items-center gap-2',
                      currentTheme === value && 'text-primary font-medium'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Notification Bell + Panel — hidden on mobile (accessed via avatar menu) */}
        {mounted && notificationsEnabled && (
          <div className="hidden md:block">
            <NotificationPanel />
          </div>
        )}

        {/* User Menu Dropdown */}
        {mounted ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="neo-interactive relative flex items-center gap-2 rounded-full p-1 outline-none lg:pr-3">
                <Avatar src={user?.image} name={user?.name || user?.email || 'Usuario'} size="sm" />
                {/* User name - hidden on mobile */}
                <span className="text-foreground hidden text-sm font-medium lg:block">
                  {user?.name || 'Usuario'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* User info */}
              <div className="px-3 py-2.5">
                <p className="text-foreground truncate text-sm font-medium">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                {/* Profile link */}
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 opacity-70" />
                    Editar perfil
                  </Link>
                </DropdownMenuItem>

                {/* Notifications link (Mobile only - desktop has bell in header) */}
                {notificationsEnabled && (
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/notifications" className="flex items-center gap-2">
                      <Bell className="h-4 w-4 opacity-70" />
                      Notificaciones
                      {unreadCount > 0 && (
                        <span className="bg-destructive text-destructive-foreground ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              {/* Theme Submenu (Mobile only - desktop has toggle in header) */}
              <div className="md:hidden">
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Tema
                </DropdownMenuLabel>
                {themes.map(({ value, label, icon: Icon }) => (
                  <DropdownMenuItem
                    key={value}
                    onSelect={(e) => {
                      e.preventDefault();
                      setTheme(value);
                    }}
                    className={cn(
                      'flex items-center gap-2',
                      currentTheme === value ? 'text-primary font-medium' : 'text-foreground'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        currentTheme === value ? 'opacity-100' : 'opacity-70'
                      )}
                    />
                    {label}
                  </DropdownMenuItem>
                ))}
              </div>

              {/* Install App (PWA) */}
              {canInstall && !isInstalled && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => promptInstall()}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4 opacity-70" />
                    Instalar app
                  </DropdownMenuItem>
                </>
              )}

              {/* Logout */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 rounded-full p-1">
            <Avatar src={user?.image} name={user?.name || user?.email || 'Usuario'} size="sm" />
          </div>
        )}
      </div>
    </header>
  );
}
