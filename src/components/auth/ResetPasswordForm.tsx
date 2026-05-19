/**
 * Reset Password Form Component
 *
 * Validates token and allows password reset.
 * Premium design matching LoginForm.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { branding } from '@/config/branding';
import { useTheme } from 'next-themes';
import { CheckCircle, AlertTriangle, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type FormState = 'loading' | 'invalid' | 'form' | 'success';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [state, setState] = useState<FormState>('loading');
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
      setError('Token no proporcionado');
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setState('form');
        } else {
          setState('invalid');
          setError(data.error || 'Token inválido o expirado');
        }
      } catch (error) {
        console.error('[ResetPasswordForm] Token validation failed:', error);
        setState('invalid');
        setError('Error al validar el token');
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        setState('success');
        toast.success('¡Contraseña actualizada!', {
          description: 'Ya puedes iniciar sesión con tu nueva contraseña.',
        });
      } else {
        setError(data.error || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      console.error('[ResetPasswordForm] Submit failed:', error);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state (Token validation)
  if (state === 'loading') {
    return (
      <div className="bg-background flex min-h-screen items-start justify-center p-4 pt-12 md:items-center md:pt-0">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Validando enlace...</p>
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

            <h1 className="text-foreground mb-2 text-xl font-semibold">Enlace inválido</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              {error || 'El enlace de recuperación es inválido o ha expirado.'}
            </p>

            <Button asChild className="h-10 w-full font-medium">
              <Link href="/forgot-password">Solicitar nuevo enlace</Link>
            </Button>

            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground mt-4 inline-flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
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

            <h1 className="text-foreground mb-2 text-xl font-semibold">¡Contraseña actualizada!</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              Tu contraseña ha sido restablecida exitosamente.
            </p>

            <Button onClick={() => router.push('/login')} className="h-10 w-full font-medium">
              Iniciar sesión
            </Button>
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
            <h1 className="text-foreground mb-2 text-2xl font-bold">Nueva contraseña</h1>
            <p className="text-muted-foreground text-sm">
              Crea una nueva contraseña para tu cuenta.
            </p>
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
                htmlFor="password"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Nueva contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="h-10 px-4 pr-10"
                  required
                  minLength={8}
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 disabled:opacity-50"
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
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="h-10 px-4"
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="h-10 w-full font-medium">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                'Guardar nueva contraseña'
              )}
            </Button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
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
