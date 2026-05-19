/**
 * Protected Layout
 *
 * Layout for authenticated pages.
 * Uses DashboardShell with sidebar and header.
 *
 * Fetches fresh user data from DB to ensure avatar/name are up-to-date
 * without requiring logout/login (CRUD-003).
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getFreshUser } from '@/lib/db/queries/users';
import { DashboardShell } from './DashboardShell';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch fresh user data from DB (CRUD-003)
  const freshUser = await getFreshUser(session.user.id);

  // If user was deleted, sign them out
  if (!freshUser) {
    redirect('/api/auth/signout');
  }

  // Merge fresh data with session fallback
  const user = {
    id: session.user.id,
    name: freshUser.name ?? session.user.name,
    email: freshUser.email ?? session.user.email,
    image: freshUser.image ?? session.user.image,
    role: freshUser.role ?? session.user.role,
  };

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
