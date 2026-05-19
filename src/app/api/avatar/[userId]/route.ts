/**
 * Avatar API Route
 *
 * Serves user avatar images from DB with cache headers.
 * Avatars are stored as base64-encoded WebP in the avatar_data column.
 *
 * @see FEAT-001
 */

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { avatarData: true },
  });

  if (!user?.avatarData) {
    return new NextResponse(null, { status: 404 });
  }

  const buffer = Buffer.from(user.avatarData, 'base64');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=86400',
      'Content-Length': buffer.length.toString(),
    },
  });
}
