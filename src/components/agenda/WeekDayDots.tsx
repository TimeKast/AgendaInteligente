/**
 * WeekDayDots — 7-day horizontal indicator (Mon → Sun).
 * Active day is a filled dot (ink-primary), others empty rings.
 * Pure visual.
 */

interface WeekDayDotsProps {
  /** 0 = Monday, 6 = Sunday */
  activeIndex: number;
}

const LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function WeekDayDots({ activeIndex }: WeekDayDotsProps) {
  return (
    <div
      role="list"
      aria-label="Días de la semana"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 'var(--ag-space-2)',
        paddingInline: 'var(--ag-space-4)',
        marginBlock: 'var(--ag-space-4)',
      }}
    >
      {LABELS.map((label, i) => {
        const active = i === activeIndex;
        return (
          <div
            key={i}
            role="listitem"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--ag-font-body)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: active ? 'var(--ag-ink-primary)' : 'var(--ag-ink-hint)',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </span>
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 'var(--ag-radius-pill)',
                backgroundColor: active ? 'var(--ag-ink-primary)' : 'transparent',
                boxShadow: active ? 'none' : 'inset 0 0 0 1px var(--ag-rule)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
