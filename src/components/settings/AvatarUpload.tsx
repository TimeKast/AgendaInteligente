'use client';

/**
 * AvatarUpload Component
 *
 * Circular avatar with upload (click or drag-and-drop) and remove functionality.
 *
 * @see FEAT-001
 */

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Camera, X, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { uploadAvatar, removeAvatar } from '@/lib/actions/avatar';

interface AvatarUploadProps {
  userId: string;
  currentImage: string | null;
  userName: string | null;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_TYPES_STRING = ACCEPTED_TYPES.join(',');
const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function validateAndUpload(
  file: File,
  currentImage: string | null,
  setPreviewUrl: (url: string | null) => void,
  setIsCustomAvatar: (v: boolean) => void,
  startTransition: (cb: () => void) => void
) {
  // Client-side validation
  if (!ACCEPTED_TYPES.includes(file.type)) {
    toast.error('Solo se permiten imágenes (JPG, PNG, WebP)');
    return;
  }

  if (file.size > MAX_SIZE_BYTES) {
    toast.error(`La imagen no puede superar ${MAX_SIZE_MB}MB`);
    return;
  }

  // Show local preview immediately
  const localPreview = URL.createObjectURL(file);
  setPreviewUrl(localPreview);

  // Upload
  const formData = new FormData();
  formData.append('file', file);

  startTransition(async () => {
    const result = await uploadAvatar(formData);

    if (result.error) {
      toast.error(result.error);
      setPreviewUrl(currentImage);
      return;
    }

    if (result.data) {
      setPreviewUrl(result.data.url);
      setIsCustomAvatar(true);
      toast.success('Avatar actualizado');
    }

    URL.revokeObjectURL(localPreview);
  });
}

export function AvatarUpload({ currentImage, userName }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage);
  const [isPending, startTransition] = useTransition();
  const [isCustomAvatar, setIsCustomAvatar] = useState(
    currentImage?.includes('/api/avatar/') ?? false
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const displayName = userName || '??';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    validateAndUpload(file, currentImage, setPreviewUrl, setIsCustomAvatar, startTransition);
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    validateAndUpload(file, currentImage, setPreviewUrl, setIsCustomAvatar, startTransition);
  };

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeAvatar();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPreviewUrl(null);
      setIsCustomAvatar(false);
      toast.success('Avatar eliminado');
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar with upload overlay */}
      <div className="group relative">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={isPending}
          className="relative cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ minWidth: 44, minHeight: 44 }}
          aria-label="Cambiar avatar"
        >
          <Avatar
            src={previewUrl}
            name={displayName}
            size="xl"
            className="h-24 w-24 shadow-(--neo-outset)"
          />

          {/* Hover / drag overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity ${
              isDragOver ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isPending ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        </button>

        {/* Remove button */}
        {isCustomAvatar && !isPending && (
          <button
            type="button"
            onClick={handleRemove}
            className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-transform hover:scale-110"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Quitar foto"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES_STRING}
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      {/* Label */}
      <p className="text-muted-foreground text-xs">
        {isPending
          ? 'Subiendo...'
          : isDragOver
            ? 'Soltar imagen aquí'
            : 'Click o arrastra una foto'}
      </p>
    </div>
  );
}
