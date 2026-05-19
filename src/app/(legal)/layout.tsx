/**
 * Legal Pages Layout
 *
 * Shared layout for Privacy Policy and Terms of Service pages.
 * Clean, professional design for legal content.
 */

import Link from 'next/link';
import { APP_CONFIG } from '@/config/app';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-muted-foreground/10 border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            {/* Logo / Home link */}
            <Link
              href="/"
              className="hover:neo-inset-sm rounded-lg px-2 py-1 text-xl font-semibold transition-all"
            >
              {APP_CONFIG.name}
            </Link>

            {/* Legal nav */}
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacidad
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Términos
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">{children}</main>

      {/* Footer */}
      <footer className="border-muted-foreground/10 mt-16 border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
            <p>
              © {new Date().getFullYear()} {APP_CONFIG.name}. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacidad
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Términos
              </Link>
              <a
                href={`mailto:${APP_CONFIG.email.legal}`}
                className="hover:text-foreground transition-colors"
              >
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
