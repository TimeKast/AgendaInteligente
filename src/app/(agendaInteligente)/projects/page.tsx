/**
 * SCR-043 — Project list (server-loaded).
 *
 * Lists every project grouped by category + an inline create form
 * that picks a category from a dropdown.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { listProjects, listCategories } from '@/lib/db/queries/catalog';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { ProjectsClient } from '@/components/agenda/ProjectsClient';

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/projects');
  }
  const [rows, categories] = await Promise.all([
    listProjects(session.user.id),
    listCategories(session.user.id),
  ]);
  return (
    <>
      <AgendaHeader dateLabel="Proyectos" />
      <ProjectsClient initial={rows} categories={categories} />
    </>
  );
}
