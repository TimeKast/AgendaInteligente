/**
 * Forgot Password Form Component
 *
 * Premium design matching LoginForm.
 * Features:
 * - Theme-aware logo
 * - Toast notifications
 * - Success state with instructions
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { branding } from '@/config/branding';
import { useTheme } from 'next-themes';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ForgotPasswordFormProps {
  defaultEmail?: string;
}

export function ForgotPasswordForm({ defaultEmail = '' }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme : 'light';
  const clientLogo = branding.getClientLogo(currentTheme);
  const logoSrc = clientLogo || branding.getTimeKastLogo('icon', currentTheme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Email requerido');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('¡Revisa tu email!', {
          description:
            'Si existe una cuenta, recibirás instrucciones para restablecer tu contraseña.',
        });
      } else {
        toast.error('Error al procesar la solicitud', {
          description: data.error || 'Intenta de nuevo más tarde',
        });
      }
    } catch (error) {
      console.error('[ForgotPasswordForm] Submit failed:', error);
      toast.error('Error de conexión', {
        description: 'Verifica tu conexión a internet',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="bg-background flex min-h-screen items-start justify-center p-4 pt-12 md:items-center md:pt-0">
        <div className="w-full max-w-md">
          <div className="neo-outset-lg bg-background rounded-2xl p-8 text-center">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <div className="bg-primary/10 relative h-16 w-16 rounded-xl p-3">
                <Image
                  src={logoSrc}
                  alt={branding.appName}
                  fill
                  priority
                  className="object-contain p-2"
                />
              </div>
            </div>

            {/* Success Icon */}
            <div className="bg-success/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Mail className="text-success h-6 w-6" />
            </div>

            <h1 className="text-foreground mb-2 text-xl font-semibold">¡Revisa tu email!</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para
              restablecer tu contraseña.
            </p>
            <p className="text-muted-foreground mb-6 text-xs">El enlace expira en 1 hora.</p>

            <Link
              href={`/login${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="text-primary inline-flex items-center gap-2 text-sm hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="bg-background flex min-h-screen items-start justify-center p-4 pt-12 md:items-center md:pt-0">
      <div className="w-full max-w-md">
        <div className="neo-outset-lg bg-background rounded-2xl p-8">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="bg-primary/10 relative h-16 w-16 rounded-xl p-3">
              <Image
                src={logoSrc}
                alt={branding.appName}
                fill
                priority
                className="object-contain p-2"
              />
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-foreground mb-2 text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
            <p className="text-muted-foreground text-sm">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-foreground mb-1.5 block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="h-10 px-4"
                required
                autoFocus
                disabled={isLoading}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="h-10 w-full font-medium">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </Button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href={`/login${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className={`text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
