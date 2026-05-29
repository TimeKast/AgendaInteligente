/**
 * Create User Page
 *
 * Dedicated page for creating a new user.
 * Delegates all UI to NewUserContent (client component).
 *
 * @see UXUI-009
 * @see crud-scaffold.md Layer 9
 */

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { NewUserContent } from '@/components/admin/NewUserContent';

export const metadata: Metadata = {
  title: 'Crear Usuario | Admin',
  description: 'Crear un nuevo usuario en el sistema',
};

export default async function CreateUserPage() {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Permission check
  if (!hasPermission(session.user.role, 'users', 'create')) {
    redirect('/today');
  }

  return <NewUserContent currentUserRole={session.user.role} />;
}
