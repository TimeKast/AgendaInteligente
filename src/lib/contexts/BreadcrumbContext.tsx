/**
 * Breadcrumb Context
 *
 * Global context for setting human-readable labels on breadcrumb segments.
 * Replaces UUIDs and dynamic route params with meaningful names.
 *
 * @example
 * // In a page component
 * <BreadcrumbSetter segment={params.id} label={user.name} />
 *
 * @see UX-021 for implementation details
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type BreadcrumbLabels = Record<string, string>;

interface BreadcrumbContextValue {
  labels: BreadcrumbLabels;
  setLabel: (key: string, value: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  labels: {},
  setLabel: () => {},
});

interface BreadcrumbProviderProps {
  children: ReactNode;
}

/**
 * Provider for breadcrumb labels context.
 * Labels persist across the session and are overwritten by BreadcrumbSetter components.
 */
export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const [labels, setLabels] = useState<BreadcrumbLabels>({});

  const setLabel = useCallback((key: string, value: string) => {
    setLabels((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ labels, setLabel }}>{children}</BreadcrumbContext.Provider>
  );
}

/**
 * Hook to access breadcrumb labels and setter.
 *
 * @example
 * const { labels, setLabel } = useBreadcrumbLabels();
 * setLabel('abc-123-uuid', 'John Doe');
 */
export const useBreadcrumbLabels = () => useContext(BreadcrumbContext);
