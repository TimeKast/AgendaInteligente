'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/common/AlertDialog';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog closes */
  onClose: () => void;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Variant for styling */
  variant?: 'danger' | 'warning' | 'default';
  /** Loading state for confirm button */
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    icon: 'bg-error/20 text-error',
    button: 'bg-error text-error-foreground hover:bg-error/90',
  },
  warning: {
    icon: 'bg-warning/20 text-warning',
    button: 'bg-warning text-warning-foreground hover:bg-warning/90',
  },
  default: {
    icon: 'bg-primary/20 text-primary',
    button: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
};

/**
 * Confirmation dialog for destructive actions.
 * Uses Radix AlertDialog internally.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="neo-float">
        {/* Override the shadcn header default (`grid place-items-center text-center`
            on mobile) so the icon-left + text-right row reads as a clean row at
            every viewport. See DRIFT-002 AC F. */}
        <AlertDialogHeader className="block text-left">
          <div className="flex items-start gap-4 text-left">
            {/* Icon */}
            <div className={cn('neo-outset-sm shrink-0 rounded-full p-3', styles.icon)}>
              <AlertTriangle className="h-6 w-6" />
            </div>

            {/* Content */}
            <div className="flex-1 text-left">
              <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-2 text-left">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(styles.button, 'disabled:opacity-50')}
          >
            {isLoading ? 'Cargando...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
