'use client';

import * as React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContentPrimitive,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDialogViewportFit } from '@/lib/hooks/useDialogViewportFit';
import { cn } from '@/lib/utils/cn';

/**
 * Viewport-aware `AlertDialogContent`. Mirrors the mobile/desktop behavior of
 * `common/Dialog`'s `DialogContent`, while preserving the kit primitive's
 * `size` prop (`'default' | 'sm'`).
 *
 * Default for in-kit usage. Import `@/components/ui/alert-dialog` directly
 * only for desktop-only contexts.
 */
function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogContentPrimitive>) {
  const ref = useDialogViewportFit<HTMLDivElement>();
  return (
    <AlertDialogContentPrimitive
      ref={ref}
      className={cn(
        'top-4 max-h-[calc(var(--dialog-vvh,100dvh)-2rem)] translate-y-0 overflow-y-auto overscroll-contain',
        'sm:top-[50%] sm:max-h-none sm:translate-y-[-50%] sm:overflow-visible',
        className
      )}
      {...props}
    >
      {children}
    </AlertDialogContentPrimitive>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
