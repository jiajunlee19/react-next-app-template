'use server'

import { v5 as uuidv5 } from 'uuid';
import sql from 'mssql';
import { sqlConfig } from "@/app/_libs/sql_config";
import { readBoxTypeSchema, createBoxTypeSchema, updateBoxTypeSchema, deleteBoxTypeSchema } from "@/app/_libs/zod_server";
import { parsedEnv, UUID5_SECRET } from '@/app/_libs/zod_env';
import { getErrorMessage } from '@/app/_libs/error_handler';
import { revalidatePath } from 'next/cache';
import prisma from '@/prisma/prisma';

const schema = 'packing';
const table = 'box_type';

export async function readBoxType() {
    try {
        let parsedForm;
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.boxType.findMany({

            });
            parsedForm = readBoxTypeSchema.array().safeParse(result);
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .query`SELECT box_type_uid, box_part_number, box_max_tray, box_type_createdAt, box_type_updatedAt 
                                    FROM "@schema"."@table"
                            `;
            parsedForm = readBoxTypeSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            return []
        };

        revalidatePath('/box_type');
        return parsedForm.data
    } 
    catch (err) {
        return []
    }
};


export async function createBoxType(formData: FormData) {

    const now = new Date();

    const parsedForm = createBoxTypeSchema.safeParse({
        box_type_uid: uuidv5(formData.get('box_part_number') as string, UUID5_SECRET),
        box_part_number: formData.get('box_part_number'),
        box_max_tray: formData.get('box_max_tray'),
        box_type_createdAt: now,
        box_type_updatedAt: now,
    });

    if (!parsedForm.success) {
        return { error: parsedForm.error.message }
    };

    try {

        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.boxType.create({
                data: parsedForm.data,
            });
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('box_type_uid', sql.VarChar, parsedForm.data.box_type_uid)
                            .input('box_part_number', sql.VarChar, parsedForm.data.box_part_number)
                            .input('box_max_tray', sql.Int, parsedForm.data.box_max_tray)
                            .input('box_type_createdAt', sql.DateTime, parsedForm.data.box_type_createdAt)
                            .input('box_type_updatedAt', sql.DateTime, parsedForm.data.box_type_updatedAt)
                            .query`INSERT INTO "@schema"."@table" 
                                    (box_type_uid, box_part_number, box_max_tray, box_type_createdAt, box_type_updatedAt)
                                    VALUES (@box_type_uid, @box_part_number, @box_max_tray, @box_type_createdAt, @box_type_updatedAt);
                            `;
        }

        revalidatePath('/box_type');
        return { success: `Successfully created box_type ${parsedForm.data.box_type_uid}` }
    } 
    catch (err) {
        return { error: getErrorMessage(err)}
    }
};


export async function updateBoxType(formData: FormData) {

    const now = new Date();

    const parsedForm = updateBoxTypeSchema.safeParse({
        box_type_uid: formData.get('box_type_uid'),
        box_part_number: formData.get('box_part_number'),
        box_max_tray: formData.get('box_max_tray'),
        box_type_updatedAt: now,
    });

    if (!parsedForm.success) {
        return { error: parsedForm.error.message }
    };

    try {

        if (parsedEnv.DB_TYPE === "PRISMA") {
            const result = await prisma.boxType.update({
                where: {
                    box_type_uid: parsedForm.data.box_type_uid,
                },
                data: parsedForm.data
            });
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('box_type_uid', sql.VarChar, parsedForm.data.box_type_uid)
                            .input('box_part_number', sql.VarChar, parsedForm.data.box_part_number)
                            .input('box_max_tray', sql.Int, parsedForm.data.box_max_tray)
                            .input('box_type_updatedAt', sql.DateTime, parsedForm.data.box_type_updatedAt)
                            .query`UPDATE "@schema"."@table" 
                                    SET box_part_number = @box_part_number, box_max_tray = @box_max_tray, box_type_updatedAt = @box_type_updatedAt
                                    WHERE box_type_uid = @box_type_uid;
                            `;
        }

        revalidatePath('/box_type');
        return { success: `Successfully updated box_type ${parsedForm.data.box_type_uid}` }
    } 
    catch (err) {
        return { error: getErrorMessage(err)}
    }
};


export async function deleteBoxType(formData: FormData) {

    const parsedForm = deleteBoxTypeSchema.safeParse({
        box_type_uid: formData.get('box_type_uid'),
    });

    if (!parsedForm.success) {
        return { error: parsedForm.error.message }
    };

    try {

        if (parsedEnv.DB_TYPE === "PRISMA") {
            const result = await prisma.boxType.delete({
                where: {
                    box_type_uid: parsedForm.data.box_type_uid,
                },
            })
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('box_type_uid', sql.VarChar, parsedForm.data.box_type_uid)
                            .query`DELETE FROM "@schema"."@table" 
                                    WHERE box_type_uid = @box_type_uid;
                            `;
        }

        revalidatePath('/box_type');
        return { success: `Successfully deleted box_type ${parsedForm.data.box_type_uid}` }
    } 
    catch (err) {
        return { error: getErrorMessage(err)}
    }
};