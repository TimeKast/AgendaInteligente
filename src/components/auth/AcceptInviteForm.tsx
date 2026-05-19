/**
 * Accept Invite Form Component
 *
 * Validates invite token and allows user to create their account.
 * Premium design matching ResetPasswordForm.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { branding } from '@/config/branding';
import { useTheme } from 'next-themes';
import { signIn } from 'next-auth/react';
import { CheckCircle, AlertTriangle, ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type FormState = 'loading' | 'invalid' | 'form' | 'success';

interface InviteData {
  email: string;
  inviterName?: string;
}

export function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<FormState>('loading');
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  const currentTheme = mounted ? resolvedTheme : 'light';
  const clientLogo = branding.getClientLogo(currentTheme);
  const logoSrc = clientLogo || branding.getTimeKastLogo('icon', currentTheme);

  // Set mounted for hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setState('invalid');
      setError('Token de invitación no proporcionado');
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/invites/validate?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setState('form');
          setInviteData({
            email: data.email,
            inviterName: data.inviterName,
          });
        } else {
          setState('invalid');
          setError(data.error || 'Invitación inválida o expirada');
        }
      } catch (error) {
        console.error('[AcceptInviteForm] Token validation failed:', error);
        setState('invalid');
        setError('Error al validar la invitación');
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });

      const data = await response.json();

      if (data.success) {
        setState('success');
        toast.success('¡Cuenta creada!', {
          description: 'Tu cuenta ha sido creada exitosamente.',
        });

        // Auto sign in
        setTimeout(async () => {
          await signIn('credentials', {
            email: data.email,
            password,
            redirect: true,
            callbackUrl: '/dashboard',
          });
        }, 1500);
      } else {
        setError(data.message || 'Error al crear la cuenta');
      }
    } catch (error) {
      console.error('[AcceptInviteForm] Submit failed:', error);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (state === 'loading') {
    return (
      <div className="bg-background flex min-h-screen items-start justify-center p-4 pt-12 md:items-center md:pt-0">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Validando invitación...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (state === 'invalid') {
    return (
      <div className="bg-background flex min-h-screen items-start justify-center p-4 pt-12 md:items-center md:pt-0">
        <div className="w-full max-w-md">
          <div className="neo-outset-lg bg-background rounded-2xl p-8 text-center">
            <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-6 w-6" />
            </div>

            <h1 className="text-foreground mb-2 text-xl font-semibold">Invitación inválida</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              {error || 'La invitación es inválida o ha expirado.'}
            </p>

            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="bg-background flex min-h-screen items-start justify-center p-4 pt-12 md:items-center md:pt-0">
        <div className="w-full max-w-md">
          <div className="neo-outset-lg bg-background rounded-2xl p-8 text-center">
            <div className="bg-success/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <CheckCircle className="text-success h-6 w-6" />
            </div>

            <h1 className="text-foreground mb-2 text-xl font-semibold">¡Bienvenido!</h1>
            <p className="text-muted-foreground mb-4 text-sm">
              Tu cuenta ha sido creada. Iniciando sesión...
            </p>
            <div className="border-primary mx-auto h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
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
            <h1 className="text-foreground mb-2 text-2xl font-bold">Aceptar invitación</h1>
            <p className="text-muted-foreground text-sm">Crea tu cuenta para unirte.</p>
          </div>

          {/* Email display */}
          {inviteData && (
            <div className="neo-inset-sm bg-background mb-4 flex items-center gap-3 rounded-xl p-3">
              <Mail className="text-muted-foreground h-5 w-5" />
              <span className="text-foreground text-sm font-medium">{inviteData.email}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-foreground mb-1.5 block text-sm font-medium">
                Tu nombre
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
                className="h-10 px-4"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="h-10 px-4 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Confirmar contraseña
              </label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="h-10 px-4"
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="h-10 w-full font-medium">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creando cuenta...
                </span>
              ) : (
                'Crear mi cuenta'
              )}
            </Button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
