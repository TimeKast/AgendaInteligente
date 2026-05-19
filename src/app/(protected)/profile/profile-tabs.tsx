'use client';

/**
 * ProfileTabs — Client wrapper for Radix Tabs on Profile page
 *
 * Separates the client-side Tabs logic from the server component.
 *
 * @see NOTIF-013
 */

import { type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Bell } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ProfileTabsProps {
  /** Default active tab */
  defaultTab: string;
  /** Content for the "Perfil" tab */
  profileContent: ReactNode;
  /** Content for the "Notificaciones" tab */
  notificationsContent: ReactNode;
}

export function ProfileTabs({
  defaultTab,
  profileContent,
  notificationsContent,
}: ProfileTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'profile') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const query = params.toString();
    router.replace(`/profile${query ? `?${query}` : ''}`, { scroll: false });
  };

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="h-auto! w-full flex-wrap p-1.5">
        <TabsTrigger value="profile" className="h-auto py-2.5">
          <User className="h-4 w-4" /> Perfil
        </TabsTrigger>
        <TabsTrigger value="notifications" className="h-auto py-2.5">
          <Bell className="h-4 w-4" /> Notificaciones
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">{profileContent}</TabsContent>
      <TabsContent value="notifications">{notificationsContent}</TabsContent>
    </Tabs>
  );
}
