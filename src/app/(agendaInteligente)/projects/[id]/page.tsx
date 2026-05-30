/**
 * SCR-PRJ-DETAIL — Project detail (server-loaded).
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadProjectDetail } from '@/lib/db/queries/project-detail';
import { ProjectDetailClient } from '@/components/agenda/ProjectDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { id } = await params;
  const project = await loadProjectDetail(session.user.id, id);
  if (!project) notFound();
  return <ProjectDetailClient initial={project} />;
}
