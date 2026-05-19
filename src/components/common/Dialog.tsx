'use client';

import * as React from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent as DialogContentPrimitive,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDialogViewportFit } from '@/lib/hooks/useDialogViewportFit';
import { cn } from '@/lib/utils/cn';

/**
 * Viewport-aware `DialogContent`. On mobile, anchors to `top-4` with a
 * max-height derived from `visualViewport` so the on-screen keyboard never
 * covers the footer. On desktop (`sm:`), keeps the centered layout from the
 * shadcn primitive.
 *
 * Default for in-kit usage. Import `@/components/ui/dialog` directly only
 * for desktop-only contexts.
 */
function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContentPrimitive>) {
  const ref = useDialogViewportFit<HTMLDivElement>();
  return (
    <DialogContentPrimitive
      ref={ref}
      className={cn(
        'top-4 max-h-[calc(var(--dialog-vvh,100dvh)-2rem)] translate-y-0 overflow-y-auto overscroll-contain',
        'sm:top-[50%] sm:max-h-none sm:translate-y-[-50%] sm:overflow-visible',
        className
      )}
      {...props}
    >
      {children}
    </DialogContentPrimitive>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
