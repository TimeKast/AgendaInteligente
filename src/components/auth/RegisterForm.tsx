/**
 * Register Form Component
 *
 * Self-service registration UI. Wired to `/api/auth/register` (KIT-022) which
 * is gated by `authFeatures.features.registration && providers.credentials`.
 * On success, the form auto-logs in via `signIn('credentials')` (same pattern
 * as `AcceptInviteForm`); if the email already existed and the password
 * doesn't match, the user is sent to `/login` with the email pre-filled.
 *
 * @see KIT-022
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

import { branding } from '@/config/branding';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type FormState = 'form' | 'submitting' | 'success';

const PASSWORD_MIN = 8;
const NAME_MIN = 2;

interface RegisterErrorPayload {
  error?: string;
  message?: string;
  details?: { fieldErrors?: Record<string, string[]> };
}

export function RegisterForm() {
  const [state, setState] = useState<FormState>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Standard next-themes hydration-safe mount pattern (avoids theme flash).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme : 'light';
  const clientLogo = branding.getClientLogo(currentTheme);
  const logoSrc = clientLogo || branding.getTimeKastLogo('icon', currentTheme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation (server re-validates with Zod)
    const trimmedName = name.trim();
    if (trimmedName.length < NAME_MIN) {
      setError(`El nombre debe tener al menos ${NAME_MIN} caracteres`);
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setState('submitting');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email, password }),
      });

      if (response.status === 429) {
        const reset = response.headers.get('X-RateLimit-Reset');
        const retryAfter = reset ? Math.max(0, Number(reset) - Math.floor(Date.now() / 1000)) : 0;
        const minutes = retryAfter > 0 ? Math.ceil(retryAfter / 60) : null;
        toast.error('Demasiados intentos', {
          description: minutes
            ? `Intenta de nuevo en ~${minutes} minuto${minutes === 1 ? '' : 's'}.`
            : 'Intenta de nuevo más tarde.',
        });
        setState('form');
        return;
      }

      if (response.status === 403) {
        toast.info('El registro está deshabilitado.');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as RegisterErrorPayload;
        const fieldErr = data.details?.fieldErrors;
        const firstFieldErr = fieldErr
          ? Object.values(fieldErr).flat().filter(Boolean)[0]
          : undefined;
        setError(firstFieldErr || data.message || 'No pudimos crear tu cuenta. Intenta de nuevo.');
        setState('form');
        return;
      }

      // 200 generic — could be a real creation or an enumeration-resistant
      // response if the email already existed. Either way, attempt sign-in.
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error || !result?.ok) {
        // Email pre-existed with a different password (or auth temporary fail)
        toast.info('Si ya tienes una cuenta, inicia sesión.');
        const params = new URLSearchParams({ email });
        window.location.href = `/login?${params.toString()}`;
        return;
      }

      setState('success');
      toast.success('¡Bienvenido!');
      // Slight delay so the success state paints before navigation
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 800);
    } catch (err) {
      console.error('[RegisterForm] submit failed:', err);
      setError('Error de conexión. Intenta de nuevo.');
      setState('form');
    }
  };

  const isLoading = state === 'submitting';

  if (state === 'success') {
    return (
      <div className="bg-background flex min-h-screen items-start justify-center p-4 pt-12 md:items-center md:pt-0">
        <div className="w-full max-w-md">
          <div className="neo-outset-lg bg-background rounded-2xl p-8 text-center">
            <h1 className="text-foreground mb-2 text-xl font-semibold">¡Cuenta creada!</h1>
            <p className="text-muted-foreground mb-4 text-sm">Iniciando sesión…</p>
            <div className="border-primary mx-auto h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-start justify-center p-4 pt-12 md:items-center md:pt-0">
      <div className="w-full max-w-md">
        <div className="neo-outset-lg bg-background rounded-2xl p-8">
          {/* Logo & Header — same pattern as LoginForm for visual parity */}
          <div className="mb-8 text-center">
            <div className="relative mx-auto mb-4 h-20 w-full max-w-70">
              {!mounted ? (
                <div className="bg-muted h-full w-full animate-pulse rounded-xl" />
              ) : (
                <Image
                  src={logoSrc}
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, 280px"
                />
              )}
            </div>
            <h1 className="text-card-foreground text-2xl font-bold">
              {clientLogo ? '' : branding.appName}
            </h1>
            <h2 className="text-muted-foreground mt-1 text-sm">Crea tu cuenta</h2>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="register-name"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Tu nombre
              </label>
              <Input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
                className="h-10 px-4"
                disabled={isLoading}
                required
                autoComplete="name"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Email
              </label>
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="h-10 px-4"
                disabled={isLoading}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
                  className="h-10 px-4 pr-10"
                  disabled={isLoading}
                  required
                  minLength={PASSWORD_MIN}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="register-confirm"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Confirmar contraseña
              </label>
              <Input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="h-10 px-4"
                disabled={isLoading}
                required
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="h-10 w-full font-medium">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creando cuenta…
                </span>
              ) : (
                'Crear cuenta'
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
