'use client';

/**
 * ProfileForm Component
 *
 * Form for editing user profile information.
 * Handles name editing, displays email as readonly,
 * and provides in-page password change for credential users.
 */

import { toast } from 'sonner';
import { User } from 'lucide-react';
import { Form, useForm } from '@/components/form/Form';
import { FormField } from '@/components/form/FormField';
import { SubmitButton } from '@/components/form/SubmitButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { profileSchema, type ProfileInput } from '@/lib/validations/profile';
import { updateProfile } from '@/lib/actions/profile';
import { ChangePasswordForm } from './ChangePasswordForm';
import { AvatarUpload } from './AvatarUpload';
import { cn } from '@/lib/utils/cn';
import { useUnsavedChangesGuard } from '@/lib/hooks/useUnsavedChangesGuard';

interface ProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    hasPassword: boolean; // true if user has password (credential login)
  };
  emailConfigured: boolean;
}

export function ProfileForm({ user, emailConfigured }: ProfileFormProps) {
  const form = useForm<ProfileInput>({
    schema: profileSchema,
    defaultValues: {
      name: user.name || '',
    },
  });
  useUnsavedChangesGuard({
    isDirty: form.formState.isDirty,
    disabled: form.formState.isSubmitting,
  });

  const handleSubmit = async (data: ProfileInput) => {
    const formData = new FormData();
    formData.append('name', data.name);

    const result = await updateProfile(formData);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    form.reset(data);
    toast.success('Perfil actualizado correctamente');
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>Actualiza tu nombre y datos de perfil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload userId={user.id} currentImage={user.image} userName={user.name} />
          <Form form={form} onSubmit={handleSubmit} className="space-y-4">
            <FormField
              name="name"
              label="Nombre"
              placeholder="Tu nombre completo"
              autoComplete="name"
            />

            {/* Email (readonly) */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-card-foreground block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className={cn(
                  'w-full rounded-xl border-0 px-4 py-3 text-sm shadow-(--neo-inset) transition-all',
                  'text-muted-foreground bg-(--input-bg)',
                  'cursor-not-allowed opacity-60'
                )}
              />
              <p className="text-muted-foreground text-xs">El email no puede ser modificado.</p>
            </div>

            <SubmitButton loadingText="Guardando...">Guardar Cambios</SubmitButton>
          </Form>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Separator />
      <ChangePasswordForm
        hasPassword={user.hasPassword}
        emailConfigured={emailConfigured}
        userEmail={user.email}
      />
    </div>
  );
}
