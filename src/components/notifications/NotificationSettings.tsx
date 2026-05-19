'use client';

/**
 * NotificationSettings — Preference matrix (category × channel)
 *
 * Displays a table with categories as rows and channels (Push, Email) as columns.
 * In-App column shows a static checkmark (always active, no toggle).
 * Push/Email columns show Switch toggles. Locked categories are disabled.
 *
 * Smart UI:
 * - Push column visible only if `isPushConfigured()`
 * - Email column visible only if `isEmailConfigured()`
 *
 * @see NOTIF-013
 */

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { Bell, Mail, Smartphone, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { getNotificationPrefs, updateNotificationPref } from '@/lib/actions/notifications';
import { PushDevicesList } from '@/components/notifications/PushDevicesList';
import { NotificationStatusBanner } from '@/components/notifications/NotificationStatusBanner';
import { NotificationCriticalBanner } from '@/components/notifications/NotificationCriticalBanner';
import { usePushSubscription } from '@/lib/hooks/usePushSubscription';
import { usePwaInstall } from '@/lib/pwa/usePwaInstall';
import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

interface ChannelPref {
  channel: string;
  enabled: boolean;
}

interface CategoryPref {
  id: string;
  label: string;
  icon: string;
  description: string;
  locked: boolean;
  channels: ChannelPref[];
}

interface NotificationSettingsProps {
  pushConfigured: boolean;
  emailConfigured: boolean;
}

// =============================================================================
// Icon mapping
// =============================================================================

const ICON_MAP: Record<string, typeof Bell> = {
  Bell,
};

const CHANNEL_META: Record<string, { label: string; icon: typeof Bell }> = {
  in_app: { label: 'In-App', icon: Bell },
  push: { label: 'Push', icon: Smartphone },
  email: { label: 'Email', icon: Mail },
};

// =============================================================================
// Component
// =============================================================================

export function NotificationSettings({
  pushConfigured,
  emailConfigured,
}: NotificationSettingsProps) {
  const [, startTransition] = useTransition();
  const [categories, setCategories] = useState<CategoryPref[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);

  const { permission } = usePushSubscription();
  const { isInstalled } = usePwaInstall();

  const needsIosPwa = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS && !isInstalled;
  }, [isInstalled]);

  // ── Fetch preferences ─────────────────────────────────────────────────────
  const loadPrefs = useCallback(() => {
    startTransition(async () => {
      const result = await getNotificationPrefs();
      if (!result.error && result.data) {
        setCategories(result.data.categories);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  // ── Toggle handler ────────────────────────────────────────────────────────
  // Toggles only persist the preference. Activating a device (subscribing)
  // happens in PushDevicesList via its own button + modal — keeping the two
  // concerns separate avoids the cancel-vs-rollback bug from the previous
  // optimistic-toggle-then-modal approach.
  const handleToggle = (channel: string, categoryId: string, enabled: boolean) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              channels: cat.channels.map((ch) =>
                ch.channel === channel ? { ...ch, enabled } : ch
              ),
            }
          : cat
      )
    );

    startTransition(async () => {
      const result = await updateNotificationPref({ channel, category: categoryId, enabled });
      if (result.error) {
        loadPrefs();
      } else {
        toast.success('Preferencias actualizadas');
      }
    });
  };

  // ── Global channel toggle ─────────────────────────────────────────────────
  const handleGlobalToggle = (channel: string, enabled: boolean) => {
    // Optimistic: update ALL categories at once
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        channels: cat.channels.map((ch) => (ch.channel === channel ? { ...ch, enabled } : ch)),
      }))
    );

    // Fire all server calls
    startTransition(async () => {
      const calls = categories.map((cat) =>
        updateNotificationPref({ channel, category: cat.id, enabled })
      );
      const results = await Promise.all(calls);
      const hasError = results.some((r) => r.error);
      if (hasError) {
        loadPrefs();
      } else {
        toast.success('Preferencias actualizadas');
      }
    });
  };

  const isChannelEnabled = (channel: string) => {
    return categories.some(
      (cat) => cat.channels.find((ch) => ch.channel === channel)?.enabled ?? false
    );
  };

  // ── Visible channels ─────────────────────────────────────────────────────
  const visibleChannels = [
    'in_app',
    ...(pushConfigured ? ['push'] : []),
    ...(emailConfigured ? ['email'] : []),
  ];

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="neo-outset-sm animate-pulse rounded-xl p-6">
        <div className="bg-muted mb-4 h-6 w-48 rounded" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ── Only DB configured → informative ──────────────────────────────────────
  if (!pushConfigured && !emailConfigured) {
    return (
      <div className="flex flex-col gap-4">
        <div className="neo-inset-sm rounded-xl p-6 text-center">
          <Bell className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
          <p className="text-foreground mb-1 font-medium">Solo notificaciones In-App</p>
          <p className="text-muted-foreground text-sm">
            Las notificaciones In-App están siempre activas. Contacta al administrador para
            habilitar push o email.
          </p>
        </div>
      </div>
    );
  }

  const pushChannelEnabled = isChannelEnabled('push');
  const hasDevices = (deviceCount ?? 0) > 0;

  return (
    // `min-w-0` lets this flex column shrink below its intrinsic
    // content width — without it, the matrix table's `min-w-105`
    // forces horizontal page scroll on viewports <420px instead of
    // letting the inner `overflow-x-auto` wrapper own the scroll.
    <div className="flex min-w-0 flex-col gap-4">
      {/* ── Critical banner (only when push is in a blocking state) ──── */}
      {pushConfigured && (
        <NotificationCriticalBanner
          permission={permission}
          needsIosPwa={needsIosPwa}
          prefsHavePushOn={pushChannelEnabled}
        />
      )}

      {/* ── Matrix Table ─────────────────────────────────────────────── */}
      <div className="neo-outset-sm w-full overflow-x-auto rounded-xl">
        <table className="w-full min-w-0">
          {/* Header */}
          <thead>
            <tr className="bg-secondary border-b border-transparent">
              <th className="text-foreground px-2 py-3 text-left text-sm font-semibold sm:px-4">
                Categoría
              </th>
              {visibleChannels.map((channel) => {
                const meta = CHANNEL_META[channel];
                if (!meta) return null;
                const Icon = meta.icon;

                return (
                  <th
                    key={channel}
                    className="w-16 px-1 py-3 text-center text-sm font-semibold sm:w-auto sm:px-4"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
                        <span className="text-foreground hidden sm:inline">{meta.label}</span>
                      </div>
                      {/* Global per-channel toggle: only meaningful with 2+
                          categories. With a single category it duplicates
                          the row toggle — drop it to avoid the confusion */}
                      {channel !== 'in_app' && categories.length > 1 && (
                        <Switch
                          size="sm"
                          checked={isChannelEnabled(channel)}
                          onCheckedChange={(checked) => handleGlobalToggle(channel, checked)}
                          aria-label={`Toggle all ${meta.label}`}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {categories.map((cat, idx) => {
              const CatIcon = ICON_MAP[cat.icon] || Bell;
              const isLast = idx === categories.length - 1;

              return (
                <tr key={cat.id} className={!isLast ? 'border-b border-transparent' : ''}>
                  {/* Category name */}
                  <td className="px-2 py-3 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <CatIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-foreground text-sm font-medium">{cat.label}</span>
                        {/* Description hidden on mobile to keep matrix narrow enough
                            for in_app + push + email columns to fit in 375px */}
                        <p className="text-muted-foreground hidden text-xs sm:block">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Channel cells */}
                  {visibleChannels.map((channel) => {
                    const channelPref = cat.channels.find((ch) => ch.channel === channel);
                    if (!channelPref) return <td key={channel} />;

                    // In-App: always active, show checkmark
                    if (channel === 'in_app') {
                      return (
                        <td key={channel} className="px-1 py-3 text-center sm:px-4">
                          <Check className="text-primary mx-auto h-4 w-4" />
                        </td>
                      );
                    }

                    // Push/Email: toggle switch
                    return (
                      <td key={channel} className="px-1 py-3 text-center sm:px-4">
                        <Switch
                          size="sm"
                          checked={channelPref.enabled}
                          onCheckedChange={(checked) => handleToggle(channel, cat.id, checked)}
                          aria-label={`${cat.label} ${CHANNEL_META[channel]?.label}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Status banner — bridges matrix and devices when out of sync ── */}
      {pushConfigured && deviceCount !== null && (
        <NotificationStatusBanner hasDevices={hasDevices} prefsHavePushOn={pushChannelEnabled} />
      )}

      {/* ── My devices (always visible when push is configured) ─────────
          Previously hidden when push was off in all categories, which made
          users think their devices were deleted. Now visible always so the
          state remains discoverable; the status banner above explains any
          desync between preferences and devices. */}
      {pushConfigured && (
        <PushDevicesList onChange={loadPrefs} onDevicesCountChange={setDeviceCount} />
      )}
    </div>
  );
}
