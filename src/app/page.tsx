import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';

/**
 * Root page handler
 *
 * Redirects users based on authentication state:
 * - Authenticated users → /dashboard
 * - Unauthenticated users → /login
 */
export default async function HomePage() {
  const session = await auth();

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  // Redirect unauthenticated users to login
  redirect('/login');
}
