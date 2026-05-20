'use client';

/**
 * IntensityCard — radio-style card to pick an intensity mode (SCR-031).
 *
 * Selection signal is a left-side ink-primary fill (4px) when active.
 * Stroke around the card thickens when active.
 *
 * Pure visual — uncontrolled radio. The "Listening" mode triggers a
 * confirmation modal when picked. Modal is implemented inline for simplicity.
 */

import { useState } from 'react';

interface IntensityCardProps {
  /** Unique radio name shared across the group. */
  name: string;
  /** Mode key (sharp / standard / gentle / listening). */
  value: string;
  title: string;
  description: string;
  /** Initial selected card in the group. */
  defaultChecked?: boolean;
  /** Tag to display in the corner (e.g. "default"). */
  tag?: string;
  /** Whether selecting this card triggers a warning modal. */
  showWarning?: boolean;
}

export function IntensityCard({
  name,
  value,
  title,
  description,
  defaultChecked,
  tag,
  showWarning,
}: IntensityCardProps) {
  const [checked, setChecked] = useState(!!defaultChecked);
  const [warningOpen, setWarningOpen] = useState(false);

  const handleSelect = () => {
    if (showWarning && !checked) {
      setWarningOpen(true);
      return;
    }
    setChecked(true);
  };

  return (
    <>
      <label
        style={{
          position: 'relative',
          display: 'block',
          padding: 'var(--ag-space-4) var(--ag-space-4) var(--ag-space-4) var(--ag-space-5)',
          marginInline: 'var(--ag-space-4)',
          marginBlock: 'var(--ag-space-2)',
          borderRadius: 'var(--ag-radius-card)',
          backgroundColor: 'var(--ag-bg-elevated)',
          boxShadow: checked
            ? 'inset 0 0 0 1.5px var(--ag-ink-primary)'
            : 'inset 0 0 0 1px var(--ag-rule)',
          cursor: 'pointer',
          transition: `box-shadow var(--ag-duration-base) var(--ag-ease)`,
        }}
      >
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={handleSelect}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
        {/* Left-edge fill when active */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            borderTopLeftRadius: 'var(--ag-radius-card)',
            borderBottomLeftRadius: 'var(--ag-radius-card)',
            backgroundColor: checked ? 'var(--ag-ink-primary)' : 'transparent',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 'var(--ag-space-2)',
            marginBottom: 6,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
            }}
          >
            {title}
          </h3>
          {tag ? (
            <span
              style={{
                fontFamily: 'var(--ag-font-mono)',
                fontSize: 10,
                color: 'var(--ag-ink-hint)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {tag}
            </span>
          ) : null}
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--ag-ink-soft)',
          }}
        >
          {description}
        </p>
      </label>

      {warningOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar listening mode"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--ag-space-4)',
          }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setWarningOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(42, 40, 38, 0.32)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              position: 'relative',
              backgroundColor: 'var(--ag-bg)',
              borderRadius: 'var(--ag-radius-card)',
              padding: 'var(--ag-space-5)',
              maxWidth: 360,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-4)',
              boxShadow: '0 2px 10px rgba(42, 40, 38, 0.12)',
            }}
          >
            <h4
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--ag-ink-primary)',
              }}
            >
              Listening mode
            </h4>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                lineHeight: 1.55,
                color: 'var(--ag-ink-soft)',
              }}
            >
              Se auto-revierte en 48h. ¿Continuar?
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--ag-space-2)',
              }}
            >
              <button
                type="button"
                onClick={() => setWarningOpen(false)}
                style={{
                  appearance: 'none',
                  border: '1px solid var(--ag-rule)',
                  background: 'transparent',
                  color: 'var(--ag-ink-soft)',
                  padding: '8px 14px',
                  borderRadius: 'var(--ag-radius-base)',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setChecked(true);
                  setWarningOpen(false);
                }}
                style={{
                  appearance: 'none',
                  border: 'none',
                  background: 'var(--ag-accent-primary)',
                  color: 'var(--ag-accent-on)',
                  padding: '8px 14px',
                  borderRadius: 'var(--ag-radius-base)',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
