'use client';

import { useFormContext as useRHFContext, Controller } from 'react-hook-form';
import { cn } from '@/lib/utils/cn';

// ─────────────────────────────────────────────────────────────────────────────
// FormCheckbox
// ─────────────────────────────────────────────────────────────────────────────

export interface FormCheckboxProps {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function FormCheckbox({ name, label, description, disabled, className }: FormCheckboxProps) {
  const {
    register,
    formState: { errors },
  } = useRHFContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          disabled={disabled}
          {...register(name)}
          className={cn(
            'neo-inset-sm mt-1 h-4 w-4 rounded border-0 transition-all',
            'bg-(--input-bg)',
            'checked:bg-primary',
            'focus:ring-primary/20 focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'ring-error/50 ring-2'
          )}
        />
        <div className="flex-1">
          <span className="text-card-foreground text-sm font-medium">{label}</span>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      </label>
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FormSwitch (Toggle)
// ─────────────────────────────────────────────────────────────────────────────

export interface FormSwitchProps {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function FormSwitch({ name, label, description, disabled, className }: FormSwitchProps) {
  const {
    control,
    formState: { errors },
  } = useRHFContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={cn('space-y-1.5', className)}>
          <label className="flex cursor-pointer items-center justify-between">
            <div className="flex-1">
              <span className="text-card-foreground text-sm font-medium">{label}</span>
              {description && <p className="text-muted-foreground text-sm">{description}</p>}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={field.value}
              disabled={disabled}
              onClick={() => field.onChange(!field.value)}
              className={cn(
                'neo-inset-sm relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all',
                'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
                field.value ? 'bg-primary' : 'bg-(--input-bg)'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-(--input-bg) shadow-(--neo-outset-sm) ring-0 transition-transform',
                  field.value ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </label>
          {error && <p className="text-error text-sm">{error}</p>}
        </div>
      )}
    />
  );
}
