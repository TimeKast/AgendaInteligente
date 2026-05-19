'use client';

/**
 * StatusToggle Component
 *
 * Reusable switch for toggling active/inactive status with confirmation dialog.
 * Works with any entity that uses soft delete pattern (deletedAt).
 *
 * @see SK-002
 */

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
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

// =============================================================================
// Types
// =============================================================================

interface StatusToggleProps {
  /** Display name for confirm dialog (e.g. "Juan García") */
  entityName: string;
  /** Whether the entity is currently active */
  isActive: boolean;
  /** Callback when toggle is confirmed */
  onToggle: () => Promise<void>;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Reason shown as tooltip when disabled */
  disabledReason?: string;
}

// =============================================================================
// Component
// =============================================================================

export function StatusToggle({
  entityName,
  isActive,
  onToggle,
  disabled = false,
  disabledReason,
}: StatusToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await onToggle();
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <div className="inline-flex items-center" title={disabled ? disabledReason : undefined}>
        <Switch
          checked={isActive}
          onCheckedChange={() => setShowConfirm(true)}
          disabled={disabled || isLoading}
          size="sm"
          aria-label={`Estado de ${entityName}`}
        />
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? `¿Desactivar a ${entityName}?` : `¿Reactivar a ${entityName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? `"${entityName}" será desactivado del sistema. Podrás reactivarlo después.`
                : `"${entityName}" será reactivado y podrá acceder al sistema nuevamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isLoading}
              className={
                isActive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''
              }
            >
              {isLoading ? 'Procesando...' : isActive ? 'Desactivar' : 'Reactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
