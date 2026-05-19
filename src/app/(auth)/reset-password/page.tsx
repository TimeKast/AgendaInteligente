/**
 * Reset Password Page
 *
 * Reset password using token from email.
 * Validates token on load, shows form if valid.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Nueva Contraseña',
  description: 'Crea una nueva contraseña para tu cuenta',
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-start justify-center pt-12 md:items-center md:pt-0">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
