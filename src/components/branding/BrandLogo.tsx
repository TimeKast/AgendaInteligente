import Image from 'next/image';
import { branding } from '@/config/branding';
import { cn } from '@/lib/utils/cn';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: { width: 24, height: 24 },
  md: { width: 32, height: 32 },
  lg: { width: 48, height: 48 },
  xl: { width: 64, height: 64 },
};

export function BrandLogo({ className, size = 'md' }: BrandLogoProps) {
  const { width, height } = sizes[size];

  return (
    <Image
      src={branding.logo}
      alt={branding.logoAlt}
      width={width}
      height={height}
      className={cn('object-contain', className)}
      priority
    />
  );
}
