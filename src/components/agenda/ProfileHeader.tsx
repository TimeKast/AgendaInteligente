/**
 * ProfileHeader — SCR-035 read-only profile section.
 *
 * Avatar (initials on warm-charcoal circle) + name (serif h2) + email caption
 * + provider chip + member-since caption.
 */

interface ProfileHeaderProps {
  initials: string;
  name: string;
  email: string;
  provider: string;
  memberSince: string;
}

export function ProfileHeader({
  initials,
  name,
  email,
  provider,
  memberSince,
}: ProfileHeaderProps) {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--ag-space-3)',
        padding: 'var(--ag-space-6) var(--ag-space-4)',
        textAlign: 'center',
      }}
    >
      <div
        aria-hidden
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--ag-radius-pill)',
          backgroundColor: 'var(--ag-ink-primary)',
          color: 'var(--ag-accent-on)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--ag-font-display)',
          fontSize: 28,
          fontWeight: 500,
        }}
      >
        {initials}
      </div>

      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontSize: 22,
          fontWeight: 500,
          color: 'var(--ag-ink-primary)',
        }}
      >
        {name}
      </h2>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
          color: 'var(--ag-ink-hint)',
        }}
      >
        {email}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-2)' }}>
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ag-slate)',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-pill)',
            padding: '2px 8px',
          }}
        >
          {provider}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--ag-ink-hint)',
        }}
      >
        Miembro desde {memberSince}
      </p>
    </section>
  );
}
