/**
 * Form Kit - react-hook-form + Zod integration
 *
 * Usage:
 * ```tsx
 * import { z } from 'zod';
 * import { Form, FormField, SubmitButton, useForm } from '@/components/form';
 *
 * const schema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email'),
 * });
 *
 * export function MyForm() {
 *   const form = useForm({ schema });
 *
 *   const onSubmit = async (data) => {
 *     console.log(data); // Typed and validated!
 *   };
 *
 *   return (
 *     <Form form={form} onSubmit={onSubmit}>
 *       <FormField name="name" label="Name" />
 *       <FormField name="email" label="Email" type="email" />
 *       <SubmitButton>Save</SubmitButton>
 *     </Form>
 *   );
 * }
 * ```
 */

// Core
export { Form, useForm, useFormContext } from './Form';
export type { FormProps, UseFormOptions } from './Form';

// Fields
export { FormField, FormTextarea } from './FormField';
export type { FormFieldProps, FormTextareaProps } from './FormField';

export { FormSelect } from './FormSelect';
export type { FormSelectProps, SelectOption } from './FormSelect';

export { FormCheckbox, FormSwitch } from './FormCheckbox';
export type { FormCheckboxProps, FormSwitchProps } from './FormCheckbox';

// Actions
export { SubmitButton } from './SubmitButton';
export type { SubmitButtonProps } from './SubmitButton';
