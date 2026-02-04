'use server'

import { rateLimitByIP, rateLimitByUid } from "@/app/_libs/rate_limit";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { redirect } from "next/navigation";
import { v5 as uuidv5 } from 'uuid';
import sql from 'mssql';
import { Pool } from 'pg';
import { pgSqlConfig, msSqlConfig } from "@/app/_libs/sql_config";
import { readExampleSchema, createExampleSchema, updateExampleSchema, deleteExampleSchema, ExampleSchema } from "@/app/_libs/zod_server";
import { itemsPerPageSchema, currentPageSchema, querySchema } from '@/app/_libs/zod_server';
import { parsedEnv } from '@/app/_libs/zod_env';
import { getErrorMessage } from '@/app/_libs/error_handler';
import { StatePromise, type State } from '@/app/_libs/types';
import { unstable_noStore as noStore } from 'next/cache';

const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);

export async function readExampleTotalPage(itemsPerPage: number | unknown, query?: string | unknown) {
    noStore();

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedQuery = querySchema.parse(query);

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';
    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `SELECT example_uid, example, example_created_dt, example_updated_dt, example_updated_by
                            FROM "jiajunleeWeb"."example"
                            WHERE (CAST(example_uid AS TEXT) LIKE $1 OR example LIKE $1);`,
                            [QUERY]
            );
            parsedForm = readExampleSchema.array().safeParse(result.rows);
            await pool.end();
        }

        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('query', sql.VarChar, QUERY)
                            .query`SELECT example_uid, example, example_created_dt, example_updated_dt, example_updated_by
                                    FROM [jiajunleeWeb].[example]
                                    WHERE (example_uid like @query OR example like @query);
                            `;
            parsedForm = readExampleSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }
    
    const totalPage = Math.ceil(parsedForm.data.length / parsedItemsPerPage);
    return totalPage
};

export async function readExampleByPage(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown) {
    noStore();

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedCurrentPage = currentPageSchema.parse(currentPage);
    const parsedQuery = querySchema.parse(query);

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }
    
    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';
    const OFFSET = (parsedCurrentPage - 1) * parsedItemsPerPage;
    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') AS example_updated_by
                            FROM "jiajunleeWeb"."example" e
                            LEFT JOIN "jiajunleeWeb"."user" u ON e.example_updated_by = u.user_uid
                            WHERE (CAST(e.example_uid AS TEXT) LIKE $1 OR e.example LIKE $1)
                            ORDER BY e.example ASC
                            OFFSET $2 LIMIT $3;`,
                            [QUERY, OFFSET, parsedItemsPerPage]
            );
            parsedForm = readExampleSchema.array().safeParse(result.rows);
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('offset', sql.Int, OFFSET)
                            .input('limit', sql.Int, parsedItemsPerPage)
                            .input('query', sql.VarChar, QUERY)
                            .query`SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') as example_updated_by
                                    FROM [jiajunleeWeb].[example] e
                                    left join [jiajunleeWeb].[user] u ON e.example_updated_by = u.user_uid
                                    WHERE (e.example_uid like @query OR e.example like @query)
                                    ORDER BY e.example asc
                                    OFFSET @offset ROWS
                                    FETCH NEXT @limit ROWS ONLY;
                            `;
            parsedForm = readExampleSchema.array().safeParse(result.recordset);
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

export async function readExample() {
    noStore();

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') AS example_updated_by
                            FROM "jiajunleeWeb"."example" e
                            LEFT JOIN "jiajunleeWeb"."user" u ON e.example_updated_by = u.user_uid;`
            );
            parsedForm = readExampleSchema.array().safeParse(result.rows);
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .query`SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') as example_updated_by
                                    FROM [jiajunleeWeb].[example] e
                                    left join [jiajunleeWeb].[user] u ON e.example_updated_by = u.user_uid
                                    ;
                            `;
            parsedForm = readExampleSchema.array().safeParse(result.recordset);
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

export async function readExampleUid(example: string | unknown) {
    noStore();

    const parsedInput = ExampleSchema.safeParse({
        example: example,
    });

    if (!parsedInput.success) {
        throw new Error(parsedInput.error.message)
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') AS example_updated_by
                            FROM "jiajunleeWeb"."example" e
                            LEFT JOIN "jiajunleeWeb"."user" u ON e.example_updated_by = u.user_uid
                            WHERE e.example = $1;`,
                            [parsedInput.data.example]
            );
            parsedForm = readExampleSchema.safeParse(result.rows[0]);
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('example', sql.VarChar, parsedInput.data.example)
                            .query`SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') as example_updated_by
                                    FROM [jiajunleeWeb].[example] e
                                    left join [jiajunleeWeb].[user] u ON e.example_updated_by = u.user_uid
                                    WHERE e.example = @example;
                            `;
            parsedForm = readExampleSchema.safeParse(result.recordset[0]);
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

export async function createExample(prevState: State | unknown, formData: FormData | unknown): StatePromise {

    if (!(formData instanceof FormData)) {
        return { 
            error: {error: ["Invalid input provided !"]},
            message: "Invalid input provided !"
        };  
    };

    const now = new Date();

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin' )) {
        return { 
            error: {error: ["Access denied."]},
            message: "Access denied."
        };
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return { 
            error: {error: ["Too many requests, try again later."]},
            message: "Too many requests, try again later."
        };
    }

    const example = formData.get('example');
    const parsedForm = createExampleSchema.safeParse({
        example_uid: (typeof example == 'string') ? uuidv5(example, UUID5_SECRET) : undefined,
        example: formData.get('example'),
        example_created_dt: now,
        example_updated_dt: now,
        example_updated_by: session.user.user_uid,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to create example!"
        };
    };

    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `INSERT INTO "jiajunleeWeb"."example"
                            (example_uid, example, example_created_dt, example_updated_dt, example_updated_by)
                            VALUES ($1, $2, $3, $4, $5);`,
                            [parsedForm.data.example_uid, parsedForm.data.example, parsedForm.data.example_created_dt, parsedForm.data.example_updated_dt, parsedForm.data.example_updated_by]
            );
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('example_uid', sql.VarChar, parsedForm.data.example_uid)
                            .input('example', sql.VarChar, parsedForm.data.example)
                            .input('example_created_dt', sql.DateTime, parsedForm.data.example_created_dt)
                            .input('example_updated_dt', sql.DateTime, parsedForm.data.example_updated_dt)
                            .input('example_updated_by', sql.VarChar, parsedForm.data.example_updated_by)
                            .query`INSERT INTO [jiajunleeWeb].[example] 
                                    (example_uid, example, example_created_dt, example_updated_dt, example_updated_by)
                                    VALUES (@example_uid, @example, @example_created_dt, @example_updated_dt, @example_updated_by);
                            `;
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: getErrorMessage(err)
        }
    }

    return { 
        message: `Successfully created example ${parsedForm.data.example_uid}` 
    }
};


export async function updateExample(prevState: State | unknown, formData: FormData | unknown): StatePromise {

    if (!(formData instanceof FormData)) {
        return { 
            error: {error: ["Invalid input provided !"]},
            message: "Invalid input provided !"
        };  
    };

    const now = new Date();

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin' )) {
        return { 
            error: {error: ["Access denied."]},
            message: "Access denied."
        };
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return { 
            error: {error: ["Too many requests, try again later."]},
            message: "Too many requests, try again later."
        };
    }

    const parsedForm = updateExampleSchema.safeParse({
        example_uid: formData.get('example_uid'),
        example_updated_dt: now,
        example_updated_by: session.user.user_uid,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to update example!"
        };
    };

    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `UPDATE "jiajunleeWeb"."example"
                            SET example_updated_dt = $1, example_updated_by = $2
                            WHERE example_uid = $3;`,
                            [parsedForm.data.example_updated_dt, parsedForm.data.example_updated_by, parsedForm.data.example_uid]
            );
            await pool.end();
        }

        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('example_uid', sql.VarChar, parsedForm.data.example_uid)
                            .input('example_updated_dt', sql.DateTime, parsedForm.data.example_updated_dt)
                            .input('example_updated_by', sql.VarChar, parsedForm.data.example_updated_by)
                            .query`UPDATE [jiajunleeWeb].[example] 
                                    SET example_updated_dt = @example_updated_dt, example_updated_by = @example_updated_by
                                    WHERE example_uid = @example_uid;
                            `;
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: getErrorMessage(err)
        }
    }

    return { message: `Successfully updated example ${parsedForm.data.example_uid}` }
};


export async function deleteExample(example_uid: string): StatePromise {

    const parsedForm = deleteExampleSchema.safeParse({
        example_uid: example_uid,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to delete example!"
        };
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin' )) {
        return { 
            error: {error: ["Access denied."]},
            message: "Access denied."
        };
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return { 
            error: {error: ["Too many requests, try again later."]},
            message: "Too many requests, try again later."
        };
    }

    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `DELETE FROM "jiajunleeWeb"."example"
                            WHERE example_uid = $1;`,
                            [parsedForm.data.example_uid]
            );
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('example_uid', sql.VarChar, parsedForm.data.example_uid)
                            .query`DELETE FROM [jiajunleeWeb].[example] 
                                    WHERE example_uid = @example_uid;
                            `;
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: getErrorMessage(err)
        }
    }

    return { message: `Successfully deleted example ${parsedForm.data.example_uid}` }
};

export async function readExampleById(example_uid: string) {
    noStore();

    const parsedInput = deleteExampleSchema.safeParse({
        example_uid: example_uid,
    });

    if (!parsedInput.success) {
        throw new Error(parsedInput.error.message)
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt,
                                    COALESCE(u.username, 'system') AS example_updated_by
                            FROM "jiajunleeWeb"."example" e
                            LEFT JOIN "jiajunleeWeb"."user" u ON e.example_updated_by = u.user_uid
                            WHERE e.example_uid = $1;`,
                            [parsedInput.data.example_uid]
            );
            parsedForm = readExampleSchema.safeParse(result.rows[0]);
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('example_uid', sql.VarChar, parsedInput.data.example_uid)
                            .query`SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') as example_updated_by
                                    FROM [jiajunleeWeb].[example] e
                                    left join [jiajunleeWeb].[user] u ON e.example_updated_by = u.user_uid
                                    WHERE e.example_uid = @example_uid;
                            `;
            parsedForm = readExampleSchema.safeParse(result.recordset[0]);
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