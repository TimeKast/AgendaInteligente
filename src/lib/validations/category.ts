/**
 * Zod schemas for Category server actions (ISSUE-010).
 *
 * Schema → DB shape mapping in `src/lib/db/schema/categories.ts` (E-003).
 *
 * Color palette: 10 warm-coherent hex values from the design system.
 * The schema accepts any 6-char hex; the UI restricts to the palette set.
 * We don't enforce palette membership in Zod so we can extend the palette
 * later without a schema migration.
 *
 * Linked: BR-3, BR-4.
 */

import { z } from 'zod';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const nameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre es requerido')
  .max(40, 'Máximo 40 caracteres')
  .refine((v) => v !== 'Inbox', {
    message: '"Inbox" está reservado para la categoría del sistema',
  });

// Color validator only — no default here. The DB column has a default of
// '#5C5C5C' and createCategory falls back to it explicitly. Adding a Zod
// `.default()` here would silently materialize the field on update, breaking
// the "no-op when nothing provided" branch.
const colorSchema = z
  .string()
  .regex(HEX_COLOR, 'El color debe ser un código hex de 6 caracteres (#RRGGBB)');

const iconSchema = z
  .string()
  .trim()
  .min(1)
  .max(40, 'Nombre de icono muy largo')
  .nullable()
  .optional();

const idSchema = z.string().uuid('ID de categoría inválido');

export const createCategorySchema = z.object({
  name: nameSchema,
  color: colorSchema.optional(),
  icon: iconSchema,
});

export const updateCategorySchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  color: colorSchema.optional(),
  icon: iconSchema,
});

export const deleteCategorySchema = z.object({
  id: idSchema,
});

/**
 * Reorder schema (ISSUE-011): pass the desired sort as an array of UUIDs.
 * The action validates that every id belongs to the user and that the array
 * has no duplicates. Min 2 — reordering a single category is a no-op.
 */
export const reorderCategoriesSchema = z.object({
  orderedIds: z
    .array(idSchema)
    .min(2, 'Necesitas al menos 2 categorías para reordenar')
    .max(100, 'Demasiadas categorías')
    .refine((arr) => new Set(arr).size === arr.length, {
      message: 'IDs duplicados',
    }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
