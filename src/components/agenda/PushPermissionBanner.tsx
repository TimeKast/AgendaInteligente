'use client';

/**
 * PushPermissionBanner — SCR-055. Top-of-screen, dismissible banner
 * prompting the user to enable browser push for daily check-ins.
 *
 * Visual-only: "Activar" triggers a toast (no real Notification.requestPermission
 * call — this is a prototype). Dismiss × hides the banner for the session.
 */

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';

interface PushPermissionBannerProps {
  /** Default visibility. Component owns its own dismissed state from there. */
  defaultVisible?: boolean;
}

export function PushPermissionBanner({ defaultVisible = true }: PushPermissionBannerProps) {
  const [visible, setVisible] = useState(defaultVisible);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Activar notificaciones push"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto',
        alignItems: 'center',
        gap: 'var(--ag-space-3)',
        padding: 'var(--ag-space-3) var(--ag-space-4)',
        backgroundColor: 'var(--ag-bg-elevated)',
        borderBottom: '1px solid var(--ag-rule)',
      }}
    >
      <Bell size={18} strokeWidth={1.5} color="var(--ag-ink-soft)" aria-hidden />

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
          color: 'var(--ag-ink-primary)',
          lineHeight: 1.4,
        }}
      >
        Activá push para recibir tus check-ins.
      </p>

      <button
        type="button"
        onClick={() => toast('Pedimos permiso al browser… [demo]')}
        style={{
          appearance: 'none',
          backgroundColor: 'var(--ag-ink-primary)',
          border: 'none',
          borderRadius: 'var(--ag-radius-base)',
          padding: '6px 12px',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ag-accent-on)',
          cursor: 'pointer',
        }}
      >
        Activar
      </button>

      <button
        type="button"
        aria-label="Descartar"
        onClick={() => setVisible(false)}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          color: 'var(--ag-ink-hint)',
          cursor: 'pointer',
          padding: 4,
          display: 'inline-flex',
        }}
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
