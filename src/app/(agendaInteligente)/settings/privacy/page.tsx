'use client';

/**
 * SCR-037 — Settings / Privacy & data
 *
 * Two sections:
 *   - Tu data: download all data as a fake blob (`{"info":"demo"}` JSON
 *     wrapped in a single-file ZIP-like blob). Triggers browser download.
 *   - Borrar cuenta: opens AccountDeletionModal with typed friction confirm.
 */

import { useState, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { SettingsSection } from '@/components/agenda/SettingsSection';
import { AccountDeletionModal } from '@/components/agenda/AccountDeletionModal';

export default function PrivacySettingsPage() {
  const [downloading, setDownloading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    window.setTimeout(() => {
      const blob = new Blob([JSON.stringify({ info: 'demo' }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agenda-inteligente-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloading(false);
      toast.success('Tu ZIP está listo.');
    }, 2000);
  }

  function handleConfirmDelete() {
    setDeleteOpen(false);
    toast('Cuenta marcada para borrado. Tenés 30 días para cancelar.');
  }

  return (
    <>
      <AgendaHeader dateLabel="Privacy & data" backHref="/settings" />

      <main className="ag-settings-content" style={mainStyle}>
        <SettingsSection label="Tu data">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-3)',
              padding: 'var(--ag-space-4)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                color: 'var(--ag-ink-soft)',
                lineHeight: 1.5,
              }}
            >
              Descargá toda tu información en JSON dentro de un ZIP.
            </p>

            <div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  appearance: 'none',
                  backgroundColor: downloading
                    ? 'var(--ag-bg-sunken)'
                    : 'var(--ag-ink-primary)',
                  border: 'none',
                  borderRadius: 'var(--ag-radius-base)',
                  padding: '10px 16px',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: downloading ? 'var(--ag-ink-hint)' : 'var(--ag-accent-on)',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                }}
              >
                {downloading ? 'Preparando…' : 'Descargar mis datos'}
              </button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection label="Borrar cuenta">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-3)',
              padding: 'var(--ag-space-4)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ag-ink-soft)',
                lineHeight: 1.5,
              }}
            >
              Soft delete 30 días. Cancelás dentro del período sin perder nada.
            </p>

            <div>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                style={{
                  appearance: 'none',
                  background: 'color-mix(in oklab, var(--ag-danger), transparent 88%)',
                  border: '1px solid color-mix(in oklab, var(--ag-danger), transparent 60%)',
                  borderRadius: 'var(--ag-radius-base)',
                  padding: '10px 16px',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--ag-danger)',
                  cursor: 'pointer',
                }}
              >
                Borrar cuenta
              </button>
            </div>
          </div>
        </SettingsSection>

        <p
          style={{
            margin: 0,
            paddingInline: 'var(--ag-space-4)',
            paddingTop: 'var(--ag-space-4)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
            lineHeight: 1.5,
          }}
        >
          Datos sensibles (tokens OAuth, contraseñas) se borran inmediatamente. El resto
          en 30 días vía cron.
        </p>
      </main>

      <AccountDeletionModal
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

const mainStyle: CSSProperties = {
  paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
};
