/**
 * User Detail Page
 *
 * Server component with header (avatar, badges, navigator).
 * Delegates tabs to UserDetailContent client component.
 *
 * @see UXUI-009
 * @see crud-scaffold.md Layer 11
 */

import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { getUserById, getAdjacentUsers } from '@/lib/actions/admin/user-admin';
import { getRoleDisplayName, getRoleStyle } from '@/config/roles';
import { getStatusStyle } from '@/config/status';
import { BreadcrumbSetter } from '@/components/common/BreadcrumbSetter';
import { Avatar } from '@/components/ui/avatar';
import { UserDetailContent } from '@/components/admin/UserDetailContent';
import { UserNavigator } from '@/components/admin/UserNavigator';

// =============================================================================
// Metadata
// =============================================================================

export const metadata: Metadata = {
  title: 'Detalle de Usuario | Admin',
  description: 'Información del usuario',
};

// =============================================================================
// Page
// =============================================================================

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Permission check
  if (!hasPermission(session.user.role, 'users', 'read')) {
    redirect('/today');
  }

  // Fetch user by identifier (humanId or UUID)
  const user = await getUserById(id);
  if (!user) {
    notFound();
  }

  // Fetch adjacent users using the resolved humanId
  const adjacent = await getAdjacentUsers(user.humanId);

  const isInactive = user.deletedAt !== null;

  return (
    <>
      {/* Set breadcrumb to user name (not UUID) */}
      <BreadcrumbSetter segment={id} label={user.name || user.email} />

      <div className="mx-auto max-w-4xl space-y-6 py-6">
        {/* Header: Avatar + Name + Badges + Pager */}
        <div className="space-y-3">
          {/* Row 1: Avatar + Name + Email */}
          <div className="flex items-start gap-4">
            <Avatar src={user.image} name={user.name || user.email} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="text-foreground text-2xl font-bold">{user.name || '—'}</h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>
          {/* Row 2: Badges + Pager */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const roleStyle = getRoleStyle(user.role);
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyle.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${roleStyle.dot}`} />
                    {getRoleDisplayName(user.role)}
                  </span>
                );
              })()}
              {(() => {
                const statusStyle = getStatusStyle(isInactive ? 'inactive' : 'active');
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                    {statusStyle.label}
                  </span>
                );
              })()}
            </div>
            <UserNavigator
              prev={adjacent.prev}
              next={adjacent.next}
              currentIndex={adjacent.currentIndex}
              total={adjacent.total}
            />
          </div>
        </div>

        {/* Tabs — client component */}
        <UserDetailContent
          user={{
            id: user.id,
            humanId: user.humanId,
            name: user.name,
            email: user.email,
            role: user.role,
          }}
          currentUserRole={session.user.role}
          isInactive={isInactive}
        />
      </div>
    </>
  );
}
