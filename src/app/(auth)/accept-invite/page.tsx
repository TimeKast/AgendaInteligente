/**
 * Accept Invite Page
 *
 * Page where invited users accept their invitation and create their account.
 * Validates token on load, shows form if valid, or error state if not.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AcceptInviteForm } from '@/components/auth/AcceptInviteForm';

export const metadata: Metadata = {
  title: 'Aceptar Invitación',
  description: 'Acepta tu invitación y crea tu cuenta',
};

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-start justify-center pt-12 md:items-center md:pt-0">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
