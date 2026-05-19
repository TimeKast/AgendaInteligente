/**
 * Auth Error Page
 *
 * Custom error page for authentication errors (expired/used magic links, etc.)
 * Displays in Spanish with starter kit design.
 */

import Link from 'next/link';
import Image from 'next/image';
import { APP_CONFIG } from '@/config/app';
import { branding } from '@/config/branding';
import { AlertTriangle, ArrowLeft, Mail } from 'lucide-react';

interface ErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Error de configuración',
    description: 'Hay un problema con la configuración del servidor. Contacta al administrador.',
  },
  AccessDenied: {
    title: 'Acceso denegado',
    description: 'No tienes permiso para acceder a este recurso.',
  },
  Verification: {
    title: 'Enlace inválido o expirado',
    description:
      'El enlace de inicio de sesión ya no es válido. Puede que haya sido usado anteriormente o haya expirado.',
  },
  Default: {
    title: 'Error de autenticación',
    description: 'Ocurrió un problema al intentar iniciar sesión. Por favor, inténtalo de nuevo.',
  },
};

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams;
  const errorType = params.error || 'Default';
  const error = errorMessages[errorType] || errorMessages.Default;

  // Always use blue logo for light mode on error page
  const logoSrc = branding.getTimeKastLogo('icon', 'light');

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="neo-outset bg-background rounded-2xl p-8 text-center">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="neo-inset-sm bg-primary/10 relative h-16 w-16 rounded-xl p-3">
              <Image
                src={logoSrc}
                alt={APP_CONFIG.name}
                fill
                priority
                className="object-contain p-2"
              />
            </div>
          </div>

          {/* Error Icon */}
          <div className="neo-outset-sm bg-destructive/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-7 w-7" />
          </div>

          {/* Error Message */}
          <h1 className="text-foreground mb-2 text-xl font-semibold">{error.title}</h1>
          <p className="text-muted-foreground mb-6 text-sm">{error.description}</p>

          {/* Actions */}
          <div className="space-y-3">
            {/* Request new magic link (for Verification errors) */}
            {errorType === 'Verification' && (
              <Link
                href="/login"
                className="bg-primary text-primary-foreground neo-outset-sm flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-all hover:shadow-md active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.1)]"
              >
                <Mail className="h-4 w-4" />
                Solicitar nuevo enlace
              </Link>
            )}

            {/* Back to login */}
            <Link
              href="/login"
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-all ${
                errorType === 'Verification'
                  ? 'text-muted-foreground hover:text-foreground hover:neo-inset-sm'
                  : 'bg-primary text-primary-foreground neo-outset-sm hover:shadow-md active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.1)]'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>

          {/* Help text */}
          <p className="text-muted-foreground mt-6 text-xs">
            ¿Necesitas ayuda?{' '}
            <a href={`mailto:${APP_CONFIG.email.support}`} className="text-primary hover:underline">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
