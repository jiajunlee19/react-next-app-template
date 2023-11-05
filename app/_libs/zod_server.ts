import { z } from 'zod';

export type TReadBoxSchema = z.infer<typeof readBoxSchema>;

export const readBoxSchema = z.object({
    box_uid: z.string().min(1).uuid().optional(),
    box_type_uid: z.string().min(1).uuid().optional(),
    box_part_number: z.string().length(10, {message: "Please input a valid part number!"}).includes("-", {message: "Please input a valid part number!"}).optional(),
    box_max_tray: z.coerce.number().int().min(1).optional(),
    box_createdAt: z.coerce.date().optional(),
    box_updatedAt: z.coerce.date().optional(),
});

export const createBoxSchema = z.object({
    box_uid: z.string().min(1).uuid(),
    box_type_uid: z.string().min(1).uuid(),
    box_status: z.enum(['active', 'shipped']),
    box_createdAt: z.coerce.date(),
    box_updatedAt: z.coerce.date(),
});

export const updateBoxSchema = z.object({
    box_uid: z.string().min(1).uuid(),
    box_type_uid: z.string().min(1).uuid(),
    box_status: z.enum(['active', 'shipped']),
    box_updatedAt: z.coerce.date(),
});

export const deleteBoxSchema = z.object({
    box_uid: z.string().min(1).uuid(),
});

export const shipBoxSchema = z.object({
    box_uid: z.string().min(1).uuid(),
    box_status: z.enum(['active', 'shipped']),
    box_updatedAt: z.coerce.date(),
});


export type TReadTraySchema = z.infer<typeof readTraySchema>;

export const readTraySchema = z.object({
    tray_uid: z.string().min(1).uuid().optional(),
    box_uid: z.string().min(1).uuid().optional(),
    tray_type_uid: z.string().min(1).uuid().optional(),
    tray_createdAt: z.coerce.date().optional(),
    tray_updatedAt: z.coerce.date().optional(),
});

export const createTraySchema = z.object({
    tray_uid: z.string().min(1).uuid(),
    box_uid: z.string().min(1).uuid(),
    tray_type_uid: z.string().min(1).uuid(),
    tray_createdAt: z.coerce.date(),
    tray_updatedAt: z.coerce.date(),
});

export const updateTraySchema = z.object({
    tray_uid: z.string().min(1).uuid(),
    box_uid: z.string().min(1).uuid(),
    tray_type_uid: z.string().min(1).uuid(),
    tray_updatedAt: z.coerce.date(),
});

export const deleteTraySchema = z.object({
    tray_uid: z.string().min(1).uuid(),
});


export type TReadLotSchema = z.infer<typeof readLotSchema>;

export const readLotSchema = z.object({
    lot_uid: z.string().min(1).uuid().optional(),
    tray_uid: z.string().min(1).uuid().optional(),
    shipdoc_uid: z.string().min(1).uuid().optional(),
    lot_id: z.string().length(10, {message: "Please enter a valid lot!"}).optional(),
    lot_qty: z.coerce.number().int().min(1).optional(),
    lot_createdAt: z.coerce.date().optional(),
    lot_updatedAt: z.coerce.date().optional(),
});

export const createLotSchema = z.object({
    lot_uid: z.string().min(1).uuid(),
    tray_uid: z.string().min(1).uuid(),
    shipdoc_uid: z.string().min(1).uuid(),
    lot_id: z.string().length(10, {message: "Please enter a valid lot!"}),
    lot_qty: z.coerce.number().int().min(1),
    lot_createdAt: z.coerce.date(),
    lot_updatedAt: z.coerce.date(),
});

export const updateLotSchema = z.object({
    lot_uid: z.string().min(1).uuid(),
    tray_uid: z.string().min(1).uuid(),
    shipdoc_uid: z.string().min(1).uuid(),
    lot_id: z.string().length(10, {message: "Please enter a valid lot!"}),
    lot_qty: z.coerce.number().int().min(1),
    lot_updatedAt: z.coerce.date(),
});

export const deleteLotSchema = z.object({
    lot_uid: z.string().min(1).uuid(),
});


export type TReadShipdocSchema = z.infer<typeof readShipdocSchema>;

export const readShipdocSchema = z.object({
    shipdoc_uid: z.string().min(1).uuid().optional(),
    shipdoc_number: z.coerce.number().int().min(1).optional(),
    shipdoc_contact: z.string().min(1).optional(),
    shipdoc_createdAt: z.coerce.date().optional(),
    shipdoc_updatedAt: z.coerce.date().optional(),
});

export const createShipdocSchema = z.object({
    shipdoc_uid: z.string().min(1).uuid(),
    shipdoc_number: z.coerce.number().int().min(1),
    shipdoc_contact: z.string().min(1),
    shipdoc_createdAt: z.coerce.date(),
    shipdoc_updatedAt: z.coerce.date(),
});

export const updateShipdocSchema = z.object({
    shipdoc_uid: z.string().min(1).uuid(),
    shipdoc_number: z.coerce.number().int().min(1),
    shipdoc_contact: z.string().min(1),
    shipdoc_updatedAt: z.coerce.date(),
});

export const deleteShipdocSchema = z.object({
    shipdoc_uid: z.string().min(1).uuid(),
});


export type TReadBoxTypeSchema = z.infer<typeof readBoxTypeSchema>;

export const readBoxTypeSchema = z.object({
    box_type_uid: z.string().min(1).uuid().optional(),
    box_part_number: z.string().length(10, {message: "Please input a valid part number!"}).includes("-", {message: "Please input a valid part number!"}).optional(),
    box_max_tray: z.coerce.number().int().min(1).optional(),
    box_type_createdAt: z.coerce.date().optional(),
    box_type_updatedAt: z.coerce.date().optional(),
});

export const createBoxTypeSchema = z.object({
    box_type_uid: z.string().min(1).uuid(),
    box_part_number: z.string().length(10, {message: "Please input a valid part number!"}).includes("-", {message: "Please input a valid part number!"}),
    box_max_tray: z.coerce.number().int().min(1),
    box_type_createdAt: z.coerce.date(),
    box_type_updatedAt: z.coerce.date(),
});

export const updateBoxTypeSchema = z.object({
    box_type_uid: z.string().min(1).uuid(),
    box_part_number: z.string().length(10, {message: "Please input a valid part number!"}).includes("-", {message: "Please input a valid part number!"}),
    box_max_tray: z.coerce.number().int().min(1),
    box_type_updatedAt: z.coerce.date(),
});

export const deleteBoxTypeSchema = z.object({
    box_type_uid: z.string().min(1).uuid(),
});


export type TReadTrayTypeSchema = z.infer<typeof readTrayTypeSchema>;

export const readTrayTypeSchema = z.object({
    tray_type_uid: z.string().min(1).uuid().optional(),
    tray_part_number: z.string().length(10, {message: "Please input a valid part number!"}).includes("-", {message: "Please input a valid part number!"}).optional(),
    tray_max_drive: z.coerce.number().int().min(1).optional(),
    tray_type_createdAt: z.coerce.date().optional(),
    tray_type_updatedAt: z.coerce.date().optional(),
});

export const createTrayTypeSchema = z.object({
    tray_type_uid: z.string().min(1).uuid(),
    tray_part_number: z.string().length(10, {message: "Please input a valid part number!"}).includes("-", {message: "Please input a valid part number!"}),
    tray_max_drive: z.coerce.number().int().min(1),
    tray_type_createdAt: z.coerce.date(),
    tray_type_updatedAt: z.coerce.date(),
});

export const updateTrayTypeSchema = z.object({
    tray_type_uid: z.string().min(1).uuid(),
    tray_part_number: z.string().length(10, {message: "Please input a valid part number!"}).includes("-", {message: "Please input a valid part number!"}),
    tray_max_drive: z.coerce.number().int().min(1),
    tray_type_updatedAt: z.coerce.date(),
});

export const deleteTrayTypeSchema = z.object({
    tray_type_uid: z.string().min(1).uuid(),
});