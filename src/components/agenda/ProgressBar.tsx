/**
 * ProgressBar — slim horizontal bar with optional numeric label.
 * Track uses --ag-rule, fill uses --ag-ink-primary. NEVER saturated.
 */

interface ProgressBarProps {
  /** 0-100 (clamped). */
  value: number;
  /** Bar height in px. Default 6. */
  thickness?: number;
  /** When true, shows a "NN%" caption on the right. */
  showLabel?: boolean;
  ariaLabel?: string;
}

export function ProgressBar({
  value,
  thickness = 6,
  showLabel = true,
  ariaLabel,
}: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        aria-label={ariaLabel ?? `Progreso ${v}%`}
        style={{
          height: thickness,
          borderRadius: 'var(--ag-radius-pill)',
          backgroundColor: 'var(--ag-bg-sunken)',
          overflow: 'hidden',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'block',
            height: '100%',
            width: `${v}%`,
            backgroundColor: 'var(--ag-ink-primary)',
            transition: 'width var(--ag-duration-base) var(--ag-ease)',
          }}
        />
      </div>
      {showLabel ? (
        <span
          style={{
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 11,
            color: 'var(--ag-ink-hint)',
            alignSelf: 'flex-end',
          }}
        >
          {v}%
        </span>
      ) : null}
    </div>
  );
}
