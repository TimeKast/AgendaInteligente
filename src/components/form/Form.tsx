'use client';

import { createContext, useContext } from 'react';
import {
  useForm as useReactHookForm,
  FormProvider,
  FieldValues,
  UseFormReturn,
  UseFormProps,
  DefaultValues,
  Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Form Context
// ─────────────────────────────────────────────────────────────────────────────

interface FormContextValue {
  isSubmitting: boolean;
}

const FormContext = createContext<FormContextValue>({ isSubmitting: false });

export function useFormContext() {
  return useContext(FormContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// useForm Hook (with Zod integration)
// ─────────────────────────────────────────────────────────────────────────────

export interface UseFormOptions<TFieldValues extends FieldValues> {
  schema: z.ZodType<TFieldValues>;
  defaultValues?: DefaultValues<TFieldValues>;
  mode?: UseFormProps['mode'];
}

/**
 * Hook wrapper that integrates react-hook-form with Zod validation
 *
 * @example
 * const schema = z.object({ name: z.string().min(1) });
 * const form = useForm({ schema, defaultValues: { name: '' } });
 */
export function useForm<TFieldValues extends FieldValues>({
  schema,
  defaultValues,
  mode = 'onBlur',
}: UseFormOptions<TFieldValues>): UseFormReturn<TFieldValues> {
  // Type assertion needed due to @hookform/resolvers Zod v4 type mismatches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolver = zodResolver(schema as any) as Resolver<TFieldValues>;

  return useReactHookForm<TFieldValues>({
    resolver,
    defaultValues,
    mode,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Component
// ─────────────────────────────────────────────────────────────────────────────

export interface FormProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (data: TFieldValues) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Form component that provides form context to child components
 *
 * @example
 * <Form form={form} onSubmit={handleSubmit}>
 *   <FormField name="email" label="Email" />
 *   <SubmitButton>Save</SubmitButton>
 * </Form>
 */
export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
}: FormProps<TFieldValues>) {
  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <FormContext.Provider value={{ isSubmitting: form.formState.isSubmitting }}>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className={className}>
          {children}
        </form>
      </FormProvider>
    </FormContext.Provider>
  );
}
