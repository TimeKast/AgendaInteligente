'use server';

/**
 * Avatar Server Actions
 *
 * Upload and remove user avatars with server-side processing.
 * Images are resized to 128×128 WebP and stored as base64 in DB.
 *
 * @see FEAT-001
 */

import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { withSelf } from '@/lib/actions/helpers';
import { type ActionResult } from '@/lib/actions/types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const AVATAR_SIZE = 128;

/**
 * Upload and process a user avatar.
 *
 * Validates file type/size, resizes to 128×128 WebP, stores base64 in DB.
 * Sets `image` column to the API route URL for serving.
 *
 * @param formData - Must contain 'file' field with image
 * @returns ActionResult with the new avatar URL or error
 */
export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'No se seleccionó ningún archivo' };
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Solo se permiten imágenes (JPG, PNG, WebP)' };
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return { error: 'La imagen no puede superar 2MB' };
  }

  // Process image: resize to 128×128 WebP
  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await sharp(buffer)
    .rotate() // Auto-orient from EXIF
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80 })
    .toBuffer();

  const base64 = processed.toString('base64');

  return await withSelf<{ url: string }>({ revalidate: '/profile' }, async (userId: string) => {
    const timestamp = Date.now();
    const avatarUrl = `/api/avatar/${userId}?v=${timestamp}`;

    await db
      .update(users)
      .set({
        avatarData: base64,
        image: avatarUrl,
        modifiedAt: new Date(),
        modifiedBy: userId,
      })
      .where(eq(users.id, userId));

    return { url: avatarUrl };
  });
}

/**
 * Remove user's custom avatar.
 *
 * Clears avatar_data and restores image to null.
 * Next OAuth login will restore the provider image automatically.
 *
 * @returns ActionResult with void or error
 */
export async function removeAvatar(): Promise<ActionResult> {
  return await withSelf({ revalidate: '/profile' }, async (userId: string) => {
    await db
      .update(users)
      .set({
        avatarData: null,
        image: null,
        modifiedAt: new Date(),
        modifiedBy: userId,
      })
      .where(eq(users.id, userId));
  });
}
