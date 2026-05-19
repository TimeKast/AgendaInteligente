import { cn } from '@/lib/utils/cn';
import Image from 'next/image';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  /** Image source URL */
  src?: string | null;
  /** Alt text / User name */
  name: string;
  /** Size variant */
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; pixels: number }> = {
  xs: { container: 'h-6 w-6', text: 'text-xs', pixels: 24 },
  sm: { container: 'h-8 w-8', text: 'text-sm', pixels: 32 },
  md: { container: 'h-10 w-10', text: 'text-base', pixels: 40 },
  lg: { container: 'h-12 w-12', text: 'text-lg', pixels: 48 },
  xl: { container: 'h-16 w-16', text: 'text-xl', pixels: 64 },
};

/**
 * Get initials from name (up to 2 characters)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate a consistent color based on name
 */
function getColorFromName(name: string): string {
  const colors = [
    'bg-badge-blue-dot',
    'bg-badge-emerald-dot',
    'bg-badge-purple-dot',
    'bg-badge-amber-dot',
    'bg-badge-pink-dot',
    'bg-badge-slate-dot',
    'bg-badge-red-dot',
    'bg-badge-blue-dot',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Avatar component with image or fallback initials
 */
export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizeStyle = sizeStyles[size];
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  if (src) {
    return (
      <div className={cn('relative overflow-hidden rounded-full', sizeStyle.container, className)}>
        <Image
          src={src}
          alt={name}
          width={sizeStyle.pixels}
          height={sizeStyle.pixels}
          className="h-full w-full object-cover"
          unoptimized={src.startsWith('/api/') || src.startsWith('blob:')}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-medium text-white',
        sizeStyle.container,
        sizeStyle.text,
        bgColor,
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
