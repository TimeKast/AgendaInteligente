/**
 * SCR-042 — Category list (server-loaded).
 *
 * Loads categories with project counts via listCategories. CategoriesClient
 * handles the inline-create form. Drag-to-reorder + per-row ⋯ menu of the
 * prototype defer to a follow-up — detail page (/categories/[id]) covers
 * rename/recolor/delete for now.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { listCategories } from '@/lib/db/queries/catalog';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { CategoriesClient } from '@/components/agenda/CategoriesClient';

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/categories');
  }
  const rows = await listCategories(session.user.id);
  return (
    <>
      <AgendaHeader dateLabel="Categorías" />
      <CategoriesClient initial={rows} />
    </>
  );
}
