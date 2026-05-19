/**
 * Breadcrumb Setter Component
 *
 * Sets a human-readable label for a breadcrumb segment.
 * Use in page components to replace UUIDs with meaningful names.
 *
 * @example
 * <BreadcrumbSetter segment={params.id} label={user.name} />
 *
 * @see UX-021 for implementation details
 */

'use client';

import { useEffect } from 'react';
import { useBreadcrumbLabels } from '@/lib/contexts/BreadcrumbContext';

interface BreadcrumbSetterProps {
  /** The URL segment to replace (e.g., UUID) */
  segment: string;
  /** The human-readable label to display */
  label: string;
}

/**
 * Sets a label for a breadcrumb segment.
 * Renders nothing — used for side effect only.
 */
export function BreadcrumbSetter({ segment, label }: BreadcrumbSetterProps) {
  const { setLabel } = useBreadcrumbLabels();

  useEffect(() => {
    if (segment && label) {
      setLabel(segment, label);
    }
  }, [segment, label, setLabel]);

  return null;
}
