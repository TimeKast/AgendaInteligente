/**
 * Site Footer Component
 *
 * Responsive footer with legal links and copyright.
 * Used across the application.
 *
 * Placeholders to replace during setup:
 * - [App Name] - Your application name
 */

import Link from 'next/link';

interface FooterProps {
  /** Application name (defaults to placeholder) */
  appName?: string;
  /** Contact email */
  contactEmail?: string;
  /** Show contact link */
  showContact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function Footer({
  appName = '[App Name]',
  contactEmail = 'contact@example.com',
  showContact = true,
  className = '',
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-background border-t ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Copyright */}
          <p className="text-muted-foreground text-sm">
            © {currentYear} {appName}. Todos los derechos reservados.
          </p>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm">
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
            {showContact && (
              <a
                href={`mailto:${contactEmail}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contacto
              </a>
            )}
          </nav>
        </div>

        {/* Optional: Secondary links row */}
        <div className="text-muted-foreground mt-4 flex flex-col items-center justify-center gap-4 border-t pt-4 text-xs md:flex-row">
          <span>Hecho con ❤️ usando TimeKast Factory</span>
        </div>
      </div>
    </footer>
  );
}
