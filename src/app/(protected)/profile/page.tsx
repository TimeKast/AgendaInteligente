/**
 * Profile Settings Page
 *
 * User profile editing page within settings.
 * Includes Tabs: "Perfil" (ProfileForm) + "Notificaciones" (NotificationSettings).
 * Route: /profile?tab=notifications
 *
 * @see NOTIF-013
 */

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth/auth';
import { getProfileUser } from '@/lib/db/queries/users';
import { isEmailConfigured, isPushConfigured } from '@/lib/env';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { BreadcrumbSetter } from '@/components/common/BreadcrumbSetter';
import { ProfileTabs } from './profile-tabs';

export const metadata: Metadata = {
  title: 'Perfil | Configuración',
};

interface ProfilePageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await getProfileUser(session.user.id);

  if (!user) {
    redirect('/login');
  }

  const emailEnabled = isEmailConfigured();
  const pushEnabled = isPushConfigured();
  const params = await searchParams;
  const defaultTab = params.tab === 'notifications' ? 'notifications' : 'profile';

  return (
    <>
      <BreadcrumbSetter segment="profile" label="Perfil" />

      <div className="mx-auto max-w-3xl space-y-6 py-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y seguridad.</p>
        </div>

        <ProfileTabs
          defaultTab={defaultTab}
          profileContent={
            <ProfileForm
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                hasPassword: !!user.password,
              }}
              emailConfigured={emailEnabled}
            />
          }
          notificationsContent={
            <NotificationSettings pushConfigured={pushEnabled} emailConfigured={emailEnabled} />
          }
        />
      </div>
    </>
  );
}
