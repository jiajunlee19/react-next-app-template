import { z } from 'zod';

export const uuidSchema = z.string().toLowerCase().min(1).uuid();

export const itemsPerPageSchema = z.coerce.number().int().min(1).catch(10);
export const currentPageSchema = z.coerce.number().int().min(1).catch(1);
export const querySchema = z.string().min(1).optional().catch(undefined);

// For Widget
export type TWidgetTabSchema = z.infer<typeof widgetTabSchema>;
export const widgetTabSchema = z.object({
    name: z.string().min(1),
    href: z.string().min(1),
})

export type TCreateWidgetSchema = z.infer<typeof createWidgetSchema>;
export const createWidgetSchema = z.object({
    widget_uid: z.string().toLowerCase().min(1).uuid(),
    widget_name: z.string().min(1),
    widget_description: z.string().min(1),
    widget_group: z.string().toUpperCase().min(1),
    widget_href: z.string().min(1),
    widget_tabs: z.string().nullish().refine((val) => {
        if (!val) return true;
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) && parsed.every((tab) => typeof tab === "object" && 'name' in tab && 'href' in tab);
        } catch {
            return false;
        }
    }, {
        message: 'Widget Tabs must be a valid JSON array of {name, href} objects ! eg: [{"name":"tab1","href":"/tab1"}]',
    }),
    widget_owners: z.string().nullish().refine((val) => {
        if (!val) return true;
        return val.split(',').every(v => v.trim().length > 0);
    }, {
        message: 'Widget Owners must be comma-separated list of username or group !'
    }),
    widget_viewers: z.string().nullish().refine((val) => {
        if (!val) return true;
        return val.split(',').every(v => v.trim().length > 0);
    }, {
        message: 'Widget Viewers must be comma-separated list of username or group !'
    }),
    widget_created_dt: z.coerce.date(),
    widget_updated_dt: z.coerce.date(),
    widget_updated_by: z.string().toLowerCase().min(1).uuid(),
});

export type TReadWidgetSchema = z.infer<typeof readWidgetSchema>;
export const readWidgetSchema = createWidgetSchema.extend({
    widget_tabs: z.array(widgetTabSchema),
    widget_owners: z.array(z.string()),
    widget_viewers: z.array(z.string()),
    widget_updated_by: z.string().toLowerCase().min(1).max(100),
}).partial();

export const updateWidgetSchema = createWidgetSchema.omit({
    widget_href: true,
    widget_created_dt: true,
});

export const deleteWidgetSchema = createWidgetSchema.pick({
    widget_uid: true,
});

export const WidgetSchema = createWidgetSchema.pick({
    widget_href: true,
});


// For Example
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

export const updateExampleSchema = createExampleSchema.omit({
    example: true,
    example_created_dt: true,
});

export const deleteExampleSchema = createExampleSchema.pick({
    example_uid: true,
});

export const ExampleSchema = createExampleSchema.pick({
    example: true,
});