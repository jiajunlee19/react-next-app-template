import { z } from 'zod';

export const uuidSchema = z.string().toLowerCase().min(1).uuid();

export const itemsPerPageSchema = z.coerce.number().int().min(1).catch(10);
export const currentPageSchema = z.coerce.number().int().min(1).catch(1);
export const querySchema = z.string().min(1).optional().catch(undefined);

export const createExampleSchema = z.object({
    example_uid: z.string().toLowerCase().min(1).uuid(),
    example: z.string().toUpperCase().min(1),
    example_created_dt: z.coerce.date(),
    example_updated_dt: z.coerce.date(),
    example_updated_by: z.string().toLowerCase().min(1).uuid(),
});

export type TReadExampleSchema = z.infer<typeof readExampleSchema>;

export const readExampleSchema = createExampleSchema.extend({
    example_updated_by: z.string().toLowerCase().min(1).max(100),
}).partial();

export const updateExampleSchema = createExampleSchema.pick({
    example_uid: true,
    example_updated_dt: true,
    example_updated_by: true,
});

export const deleteExampleSchema = createExampleSchema.pick({
    example_uid: true,
});

export const ExampleSchema = createExampleSchema.pick({
    example: true,
});