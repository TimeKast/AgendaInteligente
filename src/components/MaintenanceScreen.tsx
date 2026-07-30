/**
 * Shared "En pausa" screen — rendered by the root layout gate when
 * `MAINTENANCE_MODE` is on, and served by `/maintenance` as a public
 * static page.
 *
 * Server component, zero client JS. Inline styles keyed to the
 * warm-book palette so it renders correctly even if globals.css or
 * theme providers haven't loaded (which happens when the root layout
 * short-circuits and skips the Providers tree).
 */

export function MaintenanceScreen() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        backgroundColor: '#F5EEE0',
        color: '#2A2826',
        fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, "Times New Roman", serif',
      }}
    >
      <section
        style={{
          maxWidth: 480,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          En pausa
        </h1>
        <p
          style={{
            margin: 0,
            fontStyle: 'italic',
            fontSize: 16,
            lineHeight: 1.5,
            color: '#5A5652',
          }}
        >
          AgendaInteligente está temporalmente detenida. Los datos siguen a salvo — volvemos cuando
          la reactivemos.
        </p>
      </section>
    </main>
  );
}
