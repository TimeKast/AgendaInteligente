import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';

/**
 * Root page handler.
 *
 * - Authenticated → /today (middleware bounces to /onboarding/* if
 *   onboarding isn't completed yet).
 * - Unauthenticated → /login.
 */
export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect('/today');
  }
  redirect('/login');
}
