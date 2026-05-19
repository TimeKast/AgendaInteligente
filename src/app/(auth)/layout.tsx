/**
 * Auth Layout
 *
 * Layout for authentication pages (login, register, etc.)
 * Minimal design without navigation.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background min-h-screen">{children}</div>;
}
