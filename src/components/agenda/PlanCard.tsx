/**
 * PlanCard — SCR-036 Billing placeholder. Shows current plan name + active
 * status chip + italic serif description + member-since.
 *
 * Read-only; no upgrade CTA (deferred to v2 per discovery).
 */

interface PlanCardProps {
  planName: string;
  description: string;
  memberSince: string;
}

export function PlanCard({ planName, description, memberSince }: PlanCardProps) {
  return (
    <article
      style={{
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-card)',
        padding: 'var(--ag-space-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--ag-space-2)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 22,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
          }}
        >
          {planName}
        </h2>

        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ag-success)',
            border: '1px solid color-mix(in oklab, var(--ag-success), transparent 60%)',
            backgroundColor: 'color-mix(in oklab, var(--ag-success), transparent 88%)',
            borderRadius: 'var(--ag-radius-pill)',
            padding: '2px 8px',
          }}
        >
          Active
        </span>
      </header>

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
        {description}
      </p>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          color: 'var(--ag-ink-hint)',
        }}
      >
        Miembro desde {memberSince}
      </p>
    </article>
  );
}
