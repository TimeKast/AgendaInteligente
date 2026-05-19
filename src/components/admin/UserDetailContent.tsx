'use client';

/**
 * UserDetailContent Component
 *
 * Client-side tabs wrapper for user detail page.
 * Renders "Datos" (edit form) and "Actividad" (audit log) tabs.
 * Moves tab logic from server page.tsx to client component.
 *
 * @see UXUI-009
 * @see crud-scaffold.md Layer 11
 */

import { User, Activity } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserDataTab } from '@/components/admin/UserDataTab';
import { UserActivityLog } from '@/components/admin/UserActivityLog';

// =============================================================================
// Types
// =============================================================================

interface UserDetailContentProps {
  user: {
    id: string;
    humanId: string;
    name: string | null;
    email: string;
    role: string;
  };
  currentUserRole: string;
  isInactive: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function UserDetailContent({ user, currentUserRole, isInactive }: UserDetailContentProps) {
  return (
    <Tabs defaultValue="datos" className="w-full">
      <TabsList className="h-auto! w-full flex-wrap p-1.5">
        <TabsTrigger value="datos" className="h-auto py-2.5">
          <User className="h-4 w-4" /> Datos
        </TabsTrigger>
        <TabsTrigger value="actividad" className="h-auto py-2.5">
          <Activity className="h-4 w-4" /> Actividad
        </TabsTrigger>
      </TabsList>

      <TabsContent value="datos">
        <UserDataTab user={user} currentUserRole={currentUserRole} disabled={isInactive} />
      </TabsContent>

      <TabsContent value="actividad">
        <UserActivityLog userId={user.id} />
      </TabsContent>
    </Tabs>
  );
}
