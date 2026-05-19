'use client';

import { Controller, useFormContext as useRHFContext } from 'react-hook-form';
import { cn } from '@/lib/utils/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─────────────────────────────────────────────────────────────────────────────
// FormSelect — Radix Select + react-hook-form Controller
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FormSelect({
  name,
  label,
  options,
  placeholder,
  disabled,
  className,
}: FormSelectProps) {
  const {
    control,
    formState: { errors },
  } = useRHFContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={name} className="text-card-foreground block text-sm font-medium">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger
              id={name}
              className={cn('h-11 w-full rounded-xl px-4 text-sm', error && 'ring-error/50 ring-2')}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
}
