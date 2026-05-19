/**
 * Forgot Password Page
 *
 * Request password reset via email.
 * Uses same premium design as login page.
 */

import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña',
  description: 'Recupera el acceso a tu cuenta',
};

interface ForgotPasswordPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const email = params.email || '';

  return <ForgotPasswordForm defaultEmail={email} />;
}
