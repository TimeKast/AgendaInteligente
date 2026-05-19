/**
 * Register Page — gated self-service registration
 *
 * Renders `<RegisterForm />` when both flags are on:
 *   - `authFeatures.features.registration` (env: NEXT_PUBLIC_AUTH_REGISTRATION)
 *   - `authFeatures.providers.credentials` (env: NEXT_PUBLIC_AUTH_PASSWORD)
 *
 * Otherwise redirects to `/login` so the link in `LoginForm` (also double-gated)
 * doesn't dead-end users that arrive directly via URL.
 *
 * @see KIT-022
 */

import { redirect } from 'next/navigation';

import { authFeatures } from '@/config/auth-features';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  if (!authFeatures.features.registration || !authFeatures.providers.credentials) {
    redirect('/login');
  }
  return <RegisterForm />;
}
