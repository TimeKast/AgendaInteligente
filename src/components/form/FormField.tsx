'use client';

import { useFormContext as useRHFContext } from 'react-hook-form';
import { cn } from '@/lib/utils/cn';

// ─────────────────────────────────────────────────────────────────────────────
// FormField (Text Input)
// ─────────────────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  disabled,
  className,
  autoComplete,
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useRHFContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={name} className="text-card-foreground block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        {...register(name)}
        className={cn(
          'neo-inset-sm w-full rounded-xl border-0 px-4 py-3 text-sm transition-all',
          'text-foreground bg-(--input-bg)',
          'placeholder:text-muted-foreground placeholder:italic',
          'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:[box-shadow:var(--neo-inset)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'ring-error/50 ring-2'
        )}
      />
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FormTextarea
// ─────────────────────────────────────────────────────────────────────────────

export interface FormTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
}

export function FormTextarea({
  name,
  label,
  placeholder,
  disabled,
  className,
  rows = 4,
}: FormTextareaProps) {
  const {
    register,
    formState: { errors },
  } = useRHFContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={name} className="text-card-foreground block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        {...register(name)}
        className={cn(
          'neo-inset-sm w-full resize-none rounded-xl border-0 px-4 py-3 text-sm transition-all',
          'text-foreground bg-(--input-bg)',
          'placeholder:text-muted-foreground placeholder:italic',
          'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:[box-shadow:var(--neo-inset)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'ring-error/50 ring-2'
        )}
      />
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
}
