'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const NATIVE_CONFIRM_MESSAGE = 'Tienes cambios sin guardar. Si sales, se perderán.';

interface UnsavedChangesContextValue {
  hasUnsavedChanges: boolean;
  registerFormState: (formId: string, isDirty: boolean) => void;
  unregisterForm: (formId: string) => void;
  requestNavigation: (navigate: () => void) => void;
  allowNavigation: (navigate: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | undefined>(undefined);

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

function getHistoryIndex(): number | null {
  const state = window.history.state as { idx?: unknown } | null;
  return typeof state?.idx === 'number' ? state.idx : null;
}

/**
 * Global unsaved-changes guard:
 * - Internal navigation: custom modal
 * - Tab close/refresh: native browser prompt
 * - Browser back/forward: native browser prompt
 */
export function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const router = useRouter();
  const [dirtyForms, setDirtyForms] = useState<Record<string, true>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const bypassGuardRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const lastHistoryIndexRef = useRef<number | null>(null);

  const hasUnsavedChanges = useMemo(() => Object.keys(dirtyForms).length > 0, [dirtyForms]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const runWithGuardBypass = useCallback((navigate: () => void) => {
    bypassGuardRef.current = true;
    try {
      navigate();
    } finally {
      window.setTimeout(() => {
        bypassGuardRef.current = false;
      }, 0);
    }
  }, []);

  const registerFormState = useCallback((formId: string, isDirty: boolean) => {
    setDirtyForms((prev) => {
      if (isDirty) {
        if (prev[formId]) return prev;
        return { ...prev, [formId]: true };
      }

      if (!prev[formId]) return prev;
      const next = { ...prev };
      delete next[formId];
      return next;
    });
  }, []);

  const unregisterForm = useCallback((formId: string) => {
    setDirtyForms((prev) => {
      if (!prev[formId]) return prev;
      const next = { ...prev };
      delete next[formId];
      return next;
    });
  }, []);

  const requestNavigation = useCallback(
    (navigate: () => void) => {
      if (!hasUnsavedChangesRef.current || bypassGuardRef.current) {
        runWithGuardBypass(navigate);
        return;
      }

      pendingNavigationRef.current = navigate;
      setDialogOpen(true);
    },
    [runWithGuardBypass]
  );

  const allowNavigation = useCallback(
    (navigate: () => void) => {
      runWithGuardBypass(navigate);
    },
    [runWithGuardBypass]
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current || bypassGuardRef.current) return;
      event.preventDefault();
      event.returnValue = NATIVE_CONFIRM_MESSAGE;
      return NATIVE_CONFIRM_MESSAGE;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    lastHistoryIndexRef.current = getHistoryIndex();

    const handlePopState = () => {
      const nextHistoryIndex = getHistoryIndex();

      if (!hasUnsavedChangesRef.current || bypassGuardRef.current) {
        lastHistoryIndexRef.current = nextHistoryIndex;
        return;
      }

      const previousHistoryIndex = lastHistoryIndexRef.current;
      const movedBack =
        nextHistoryIndex !== null && previousHistoryIndex !== null
          ? nextHistoryIndex < previousHistoryIndex
          : true;

      const shouldLeave = window.confirm(NATIVE_CONFIRM_MESSAGE);
      if (!shouldLeave) {
        bypassGuardRef.current = true;
        window.history.go(movedBack ? 1 : -1);
        window.setTimeout(() => {
          bypassGuardRef.current = false;
          lastHistoryIndexRef.current = getHistoryIndex();
        }, 0);
        return;
      }

      lastHistoryIndexRef.current = nextHistoryIndex;
      pendingNavigationRef.current = null;
      setDialogOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!hasUnsavedChangesRef.current || bypassGuardRef.current) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('javascript:')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl === currentUrl) return;

      event.preventDefault();
      requestNavigation(() => {
        router.push(nextUrl);
      });
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [requestNavigation, router]);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    pendingNavigationRef.current = null;
  }, []);

  const handleDialogConfirm = useCallback(() => {
    const navigate = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setDialogOpen(false);
    if (!navigate) return;
    runWithGuardBypass(navigate);
  }, [runWithGuardBypass]);

  const value = useMemo(
    () => ({
      hasUnsavedChanges,
      registerFormState,
      unregisterForm,
      requestNavigation,
      allowNavigation,
    }),
    [allowNavigation, hasUnsavedChanges, registerFormState, requestNavigation, unregisterForm]
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}

      <ConfirmDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        title="Tienes cambios sin guardar"
        description="Si sales de esta página, la información capturada se perderá."
        confirmText="Salir sin guardar"
        cancelText="Seguir editando"
        variant="default"
      />
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges(): UnsavedChangesContextValue {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider');
  }
  return context;
}
