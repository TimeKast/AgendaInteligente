/**
 * Maintenance / paused-app landing page.
 *
 * Served with HTTP 503 (rewrite in `src/middleware.ts`) whenever
 * `MAINTENANCE_MODE` is truthy (or, by design, unset). Static —
 * no session, no DB read, no client bundle. The warm-book skin
 * variables from the root layout inherit through so it doesn't
 * look like a stock 503.
 */

export const dynamic = 'force-static';

export const metadata = {
  title: 'En pausa · AgendaInteligente',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
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
