'use client';

import { useFormContext } from './Form';
import { cn } from '@/lib/utils/cn';

// ─────────────────────────────────────────────────────────────────────────────
// SubmitButton
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
}

export function SubmitButton({
  children,
  className,
  loadingText = 'Guardando...',
}: SubmitButtonProps) {
  const { isSubmitting } = useFormContext();

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={cn(
        'w-full rounded-xl py-3 font-semibold transition-all',
        'bg-primary text-primary-foreground neo-outset-sm hover:shadow-(--neo-outset) active:shadow-(--neo-pressed)',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {isSubmitting ? loadingText : children}
    </button>
  );
}
