'use client';

/**
 * ChangePasswordForm Component
 *
 * Form for changing password in-place.
 * Shows:
 * - Current password + new password form (always)
 * - "Forgot password?" link to send reset email (if email configured)
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { changePassword } from '@/lib/actions/change-password';
import { sendPasswordResetEmail } from '@/lib/actions/send-reset-email';
import { cn } from '@/lib/utils/cn';

interface ChangePasswordFormProps {
  /** Whether user already has a password (credential login) */
  hasPassword: boolean;
  emailConfigured: boolean;
  /** Used as a hidden `autocomplete="username"` field so password managers can associate the credential change with the right account. */
  userEmail: string;
}

export function ChangePasswordForm({
  hasPassword,
  emailConfigured,
  userEmail,
}: ChangePasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSubmitting(true);

    const formData = new FormData(form);
    const result = await changePassword(formData);

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Contraseña actualizada correctamente');
    form.reset();
  };

  const handleSendResetEmail = async () => {
    setIsSendingReset(true);
    const result = await sendPasswordResetEmail();
    setIsSendingReset(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Te enviamos un email con instrucciones para restablecer tu contraseña');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          {hasPassword ? 'Cambiar Contraseña' : 'Establecer Contraseña'}
        </CardTitle>
        <CardDescription>
          {hasPassword
            ? 'Actualiza tu contraseña de acceso.'
            : 'Tu cuenta usa OAuth. Establece una contraseña para también poder acceder con credenciales.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="username"
            autoComplete="username"
            value={userEmail}
            readOnly
            hidden
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* Current Password — only for users who already have one */}
          {hasPassword && (
            <div className="space-y-1.5">
              <label
                htmlFor="currentPassword"
                className="text-card-foreground block text-sm font-medium"
              >
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className={cn(
                    'w-full rounded-xl border-0 px-4 py-3 pr-10 text-sm shadow-(--neo-inset) transition-all',
                    'text-foreground bg-(--input-bg)',
                    'focus:ring-primary/20 focus:shadow-(--neo-inset) focus:ring-2 focus:outline-none'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-card-foreground block text-sm font-medium">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                className={cn(
                  'w-full rounded-xl border-0 px-4 py-3 pr-10 text-sm shadow-(--neo-inset) transition-all',
                  'text-foreground bg-(--input-bg)',
                  'focus:ring-primary/20 focus:shadow-(--neo-inset) focus:ring-2 focus:outline-none'
                )}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-muted-foreground text-xs">Mínimo 8 caracteres</p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-card-foreground block text-sm font-medium"
            >
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className={cn(
                'w-full rounded-xl border-0 px-4 py-3 text-sm shadow-(--neo-inset) transition-all',
                'text-foreground bg-(--input-bg)',
                'focus:ring-primary/20 focus:shadow-(--neo-inset) focus:ring-2 focus:outline-none'
              )}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? 'Guardando...'
                : hasPassword
                  ? 'Cambiar Contraseña'
                  : 'Establecer Contraseña'}
            </Button>

            {emailConfigured && (
              <>
                <div className="flex items-center gap-3">
                  <div className="bg-border h-px flex-1" />
                  <span className="text-muted-foreground text-xs uppercase">ó</span>
                  <div className="bg-border h-px flex-1" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendResetEmail}
                  disabled={isSendingReset}
                  className="w-full gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {isSendingReset ? 'Enviando...' : 'Enviar email de recuperación'}
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
