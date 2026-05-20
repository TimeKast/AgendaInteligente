/**
 * OnboardingProgress — 8-dot progress indicator across the top.
 * Active dot is ink-primary filled; visited dots are ink-soft filled;
 * upcoming dots are empty rings (--ag-rule).
 */

interface OnboardingProgressProps {
  /** 1-indexed current step (1-8). */
  current: number;
  /** Total number of steps. Defaults to 8. */
  total?: number;
}

export function OnboardingProgress({ current, total = 8 }: OnboardingProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Paso ${current} de ${total}`}
      style={{
        display: 'flex',
        gap: 6,
        justifyContent: 'center',
        paddingBlock: 'var(--ag-space-3)',
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const isCurrent = step === current;
        const isVisited = step < current;
        return (
          <span
            key={i}
            aria-hidden
            style={{
              display: 'inline-block',
              width: isCurrent ? 18 : 6,
              height: 6,
              borderRadius: 'var(--ag-radius-pill)',
              backgroundColor: isCurrent
                ? 'var(--ag-ink-primary)'
                : isVisited
                  ? 'var(--ag-ink-soft)'
                  : 'transparent',
              boxShadow: !isCurrent && !isVisited ? 'inset 0 0 0 1px var(--ag-rule)' : 'none',
              transition: `width var(--ag-duration-base) var(--ag-ease)`,
            }}
          />
        );
      })}
    </div>
  );
}
