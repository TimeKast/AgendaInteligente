/**
 * Login Page
 *
 * Public authentication page.
 * Redirects to dashboard if already authenticated.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Inicia sesión en tu cuenta',
};

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    email?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Check if user is already authenticated
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const callbackUrl = params.callbackUrl || '/dashboard';
  const error = params.error;
  const email = params.email || '';

  return (
    <div className="bg-background flex min-h-screen items-start justify-center p-4 pt-12 md:items-center md:pt-0">
      <LoginForm callbackUrl={callbackUrl} error={error} defaultEmail={email} />
    </div>
  );
}
