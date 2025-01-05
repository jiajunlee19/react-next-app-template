import { z } from 'zod';

export const uuidSchema = z.string().toLowerCase().min(1).uuid();

export const itemsPerPageSchema = z.coerce.number().int().min(1).catch(10);
export const currentPageSchema = z.coerce.number().int().min(1).catch(1);
export const querySchema = z.string().min(1).optional().catch(undefined);

export const createTypeSchema = z.object({
    type_uid: z.string().toLowerCase().min(1).uuid(),
    type: z.string().toUpperCase().min(1),
    type_created_dt: z.coerce.date(),
    type_updated_dt: z.coerce.date(),
});

export type TReadTypeSchema = z.infer<typeof readTypeSchema>;

export const readTypeSchema = createTypeSchema.partial();

export const updateTypeSchema = createTypeSchema.pick({
    type_uid: true,
    type_updated_dt: true,
});

export const deleteTypeSchema = createTypeSchema.pick({
    type_uid: true,
});

export const TypeSchema = createTypeSchema.pick({
    type: true,
});