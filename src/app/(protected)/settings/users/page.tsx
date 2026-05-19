/**
 * Admin Users Page
 *
 * User management page for ADMIN and SUPER_ADMIN roles.
 * Lists all users with CRUD operations.
 *
 * @see CRUD-002
 */

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { getUsers } from '@/lib/actions/admin/user-admin';
import { UserTable } from '@/components/admin/UserTable';
import { isEmailConfigured } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Usuarios | Admin',
  description: 'Gestión de usuarios del sistema',
};

export default async function AdminUsersPage() {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Permission check
  if (!hasPermission(session.user.role, 'users', 'list')) {
    redirect('/dashboard');
  }

  // Fetch users
  const users = await getUsers();

  // Check if email is configured (for invite functionality)
  const emailConfigured = isEmailConfigured();

  return (
    <div className="container mx-auto space-y-4 py-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Gestión de usuarios</h1>
        <p className="text-muted-foreground text-sm">Administra los usuarios del sistema</p>
      </div>
      <UserTable
        users={users}
        currentUserRole={session.user.role}
        currentUserId={session.user.id}
        emailConfigured={emailConfigured}
      />
    </div>
  );
}
