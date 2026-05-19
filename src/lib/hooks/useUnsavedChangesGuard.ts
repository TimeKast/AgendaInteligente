'use client';

import { useCallback, useEffect, useId } from 'react';
import { useUnsavedChanges } from '@/lib/contexts/UnsavedChangesContext';

export interface UseUnsavedChangesGuardOptions {
  isDirty: boolean;
  disabled?: boolean;
}

export interface UseUnsavedChangesGuardReturn {
  hasUnsavedChanges: boolean;
  confirmNavigation: (navigate: () => void) => void;
  allowNavigation: (navigate: () => void) => void;
}

/**
 * Registers form dirty state in the global unsaved-changes provider
 * and exposes guarded navigation helpers for buttons/actions.
 */
export function useUnsavedChangesGuard({
  isDirty,
  disabled = false,
}: UseUnsavedChangesGuardOptions): UseUnsavedChangesGuardReturn {
  const {
    hasUnsavedChanges,
    registerFormState,
    unregisterForm,
    requestNavigation,
    allowNavigation,
  } = useUnsavedChanges();

  const formId = useId();

  useEffect(() => {
    return () => {
      unregisterForm(formId);
    };
  }, [formId, unregisterForm]);

  useEffect(() => {
    registerFormState(formId, !disabled && isDirty);
  }, [disabled, formId, isDirty, registerFormState]);

  const confirmNavigation = useCallback(
    (navigate: () => void) => {
      requestNavigation(navigate);
    },
    [requestNavigation]
  );

  const navigateWithoutPrompt = useCallback(
    (navigate: () => void) => {
      allowNavigation(navigate);
    },
    [allowNavigation]
  );

  return {
    hasUnsavedChanges,
    confirmNavigation,
    allowNavigation: navigateWithoutPrompt,
  };
}
