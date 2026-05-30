/**
 * SCR-CAT-DETAIL — Category detail (server-loaded).
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadCategoryDetail } from '@/lib/db/queries/category-detail';
import { CategoryDetailClient } from '@/components/agenda/CategoryDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { id } = await params;
  const cat = await loadCategoryDetail(session.user.id, id);
  if (!cat) notFound();
  return <CategoryDetailClient initial={cat} />;
}
