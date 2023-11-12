'use server'

import { v5 as uuidv5 } from 'uuid';
import sql from 'mssql';
import { sqlConfig } from "@/app/_libs/sql_config";
import { readBoxTypeSchema, createBoxTypeSchema, updateBoxTypeSchema, deleteBoxTypeSchema, TReadBoxTypeSchema } from "@/app/_libs/zod_server";
import { parsedEnv } from '@/app/_libs/zod_env';
import { getErrorMessage } from '@/app/_libs/error_handler';
import { revalidatePath } from 'next/cache';
import prisma from '@/prisma/prisma';
import { StatePromise, type State } from '@/app/_libs/types';
import { unstable_noStore as noStore } from 'next/cache';

const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);
const schema = 'packing';
const table = 'box_type';

export async function readBoxTypeTotalPage(itemsPerPage: number, query?: string) {
    noStore();
    const queryChecked = query && "";
    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.boxType.findMany({
                where: {
                    ...(query &&
                        {
                            OR: [
                                {
                                    box_type_uid: {
                                        search: `${query}:*`,
                                    },
                                },
                                {
                                    box_part_number: {
                                        search: `${query}:*`,
                                    },
                                },
                            ],
                        }),
                },
            });
            parsedForm = readBoxTypeSchema.array().safeParse(result);
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('query', sql.VarChar, `${queryChecked}%`)
                            .query`SELECT box_type_uid, box_part_number, box_max_tray, box_type_createdAt, box_type_updatedAt 
                                    FROM "@schema"."@table"
                                    WHERE (box_type_uid like @query OR box_part_number like @query);
                            `;
            parsedForm = readBoxTypeSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }
    const totalPage = Math.ceil(parsedForm.data.length / itemsPerPage);
    revalidatePath('/box_type');
    return totalPage
};

export async function readBoxTypeByPage(itemsPerPage: number, currentPage: number, query?: string) {
    noStore();

    // <dev only> 
    // Artifically delay the response, to view the Suspense fallback skeleton
    // console.log("waiting 3sec")
    // await new Promise((resolve) => setTimeout(resolve, 3000));
    // console.log("ok")
    // <dev only>

    const queryChecked = query && "";
    const OFFSET = (currentPage - 1) * itemsPerPage;
    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.boxType.findMany({
                where: {
                    ...(query &&
                        {
                            OR: [
                                {
                                    box_type_uid: {
                                        search: `${query}:*`,
                                    },
                                },
                                {
                                    box_part_number: {
                                        search: `${query}:*`,
                                    },
                                },
                            ],
                        }),
                },
                skip: OFFSET,
                take: itemsPerPage,
            });
            parsedForm = readBoxTypeSchema.array().safeParse(result);
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('offset', sql.Int, OFFSET)
                            .input('limit', sql.Int, itemsPerPage)
                            .input('query', sql.VarChar, `${queryChecked}%`)
                            .query`SELECT box_type_uid, box_part_number, box_max_tray, box_type_createdAt, box_type_updatedAt 
                                    FROM "@schema"."@table"
                                    WHERE (box_type_uid like @query OR box_part_number like @query)
                                    OFFSET @offset ROWS
                                    FETCH NEXT @limit ROWS ONLY;
                            `;
            parsedForm = readBoxTypeSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    revalidatePath('/box_type');
    return parsedForm.data
};

export async function createBoxType(prevState: State, formData: FormData): StatePromise {

    const now = new Date();

    const parsedForm = createBoxTypeSchema.safeParse({
        box_type_uid: uuidv5(formData.get('box_part_number') as string, UUID5_SECRET),
        box_part_number: formData.get('box_part_number'),
        box_max_tray: formData.get('box_max_tray'),
        box_type_createdAt: now,
        box_type_updatedAt: now,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to create box_type!"
        };
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
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: getErrorMessage(err)
        }
    }

    revalidatePath('/box_type');
    return { 
        message: `Successfully created box_type ${parsedForm.data.box_type_uid}` 
    }
};


export async function updateBoxType(prevState: State, formData: FormData): StatePromise {

    const now = new Date();

    const parsedForm = updateBoxTypeSchema.safeParse({
        box_type_uid: formData.get('box_type_uid'),
        box_max_tray: formData.get('box_max_tray'),
        box_type_updatedAt: now,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to update box_type!"
        };
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
                            .input('box_max_tray', sql.Int, parsedForm.data.box_max_tray)
                            .input('box_type_updatedAt', sql.DateTime, parsedForm.data.box_type_updatedAt)
                            .query`UPDATE "@schema"."@table" 
                                    SET box_max_tray = @box_max_tray, box_type_updatedAt = @box_type_updatedAt
                                    WHERE box_type_uid = @box_type_uid;
                            `;
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: getErrorMessage(err)
        }
    }

    revalidatePath('/box_type');
    return { message: `Successfully updated box_type ${parsedForm.data.box_type_uid}` }
};


export async function deleteBoxType(box_type_uid: string): StatePromise {

    const parsedForm = deleteBoxTypeSchema.safeParse({
        box_type_uid: box_type_uid,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to delete box_type!"
        };
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
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: getErrorMessage(err)
        }
    }

    revalidatePath('/box_type');
    return { message: `Successfully deleted box_type ${parsedForm.data.box_type_uid}` }
};

export async function readBoxTypeById(box_type_uid: string) {
    noStore();
    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.boxType.findUnique({
                where: {
                    box_type_uid: box_type_uid,
                }
            });
            parsedForm = readBoxTypeSchema.safeParse(result);
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .query`SELECT box_type_uid, box_part_number, box_max_tray, box_type_createdAt, box_type_updatedAt 
                                    FROM "@schema"."@table"
                                    WHERE box_type_uid = @box_type_uid;
                            `;
            parsedForm = readBoxTypeSchema.safeParse(result.recordset[0]);
        }

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };

    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    return parsedForm.data
};