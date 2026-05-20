'use client';

/**
 * WaveformAnim — simple CSS animated waveform (12 bars).
 * Pure visual signal that "recording" is happening. No real audio analysis.
 * Calm tempo (ease-standard, ~700ms cycle) — not bouncy.
 */

export function WaveformAnim() {
  const bars = 14;
  return (
    <div
      aria-hidden
      className="ag-waveform"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 40,
      }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        // Stagger via animation-delay; vary base height for organic feel.
        const heights = [10, 22, 14, 30, 18, 26, 12, 28, 16, 24, 20, 32, 14, 22];
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 3,
              height: heights[i % heights.length],
              borderRadius: 2,
              backgroundColor: 'var(--ag-ink-soft)',
              animation: `ag-wave 900ms ${i * 60}ms var(--ag-ease) infinite`,
              transformOrigin: 'center',
            }}
          />
        );
      })}

      <style>
        {`
          @keyframes ag-wave {
            0%, 100% { transform: scaleY(0.45); opacity: 0.55; }
            50%      { transform: scaleY(1.05); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
