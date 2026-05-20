/**
 * SettingsSection — caption-style label above a grouped block of SettingRows.
 */

import type { ReactNode } from 'react';

interface SettingsSectionProps {
  label: string;
  children: ReactNode;
}

export function SettingsSection({ label, children }: SettingsSectionProps) {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'var(--ag-space-5)',
      }}
    >
      <h2
        style={{
          margin: 0,
          paddingInline: 'var(--ag-space-4)',
          paddingBottom: 'var(--ag-space-2)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {label}
      </h2>
      <div
        style={{
          backgroundColor: 'var(--ag-bg-elevated)',
          borderTop: '1px solid var(--ag-rule)',
          borderBottom: '1px solid var(--ag-rule)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </section>
  );
}
