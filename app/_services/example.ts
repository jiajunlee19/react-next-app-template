import "server-only";

import { rateLimitByIP, rateLimitByUid } from "@/app/_libs/rate_limit";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { v5 as uuidv5 } from 'uuid';
import sql from 'mssql';
import { Pool } from 'pg';
import { pgSqlConfig, msSqlConfig } from "@/app/_libs/sql_config";
import { readExampleSchema, createExampleSchema, updateExampleSchema, deleteExampleSchema, ExampleSchema, type TReadExampleSchema } from "@/app/_libs/zod_server";
import { itemsPerPageSchema, currentPageSchema, querySchema } from '@/app/_libs/zod_server';
import { parsedEnv } from '@/app/_libs/zod_env';
import { getErrorMessage } from '@/app/_libs/error_handler';
import { type ServerResponse } from '@/app/_libs/types';
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag, revalidateTag } from 'next/cache'; 
import { checkWidgetAccess } from "@/app/_libs/widgets";
import { snowflakePool } from "@/app/_libs/snowflake_config";

const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);

export async function revalidateSnowflakeCacheService(): Promise<ServerResponse<undefined>> {
    
    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    const { hasWidgetOwnerAccess, owners } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

    if (!hasWidgetOwnerAccess) {
        return {
            success: false,
            message: `Access denied. Kindly contact owners (${owners}) to get access.`,
            reason: "Access Denied",
        }    
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }
    
    revalidateTag("snowflake");

    return {
        success: true,
        message: "Successfully revalidated snowflake cache.",
        data: undefined,
    }
};

async function getSnowflake(inputList: string[], placeholders: string) {
    "use cache"
    cacheLife("days");
    cacheTag("snowflake", "readSnowflake");

    const result = await snowflakePool.use(conn => new Promise((resolve, reject) => {
        conn.execute({
            sqlText: `
                select * from table where col in ${placeholders};
            `,
            binds: [...inputList],
            complete: (err, stmt, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            },
        })
    }));

    return result;
};

export async function readSnowflakeService(inputList: string[]): Promise<ServerResponse<TReadExampleSchema[]>> {

    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

    if (!hasWidgetViewAccess) {
        return {
            success: false,
            message: `Access denied. You are not part of the viewers (${viewers}). Kindly contact owners (${owners}) to get access.`,
            reason: "Access Denied",
        }    
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    const placeholders = inputList.map(() => '?').join(', ');
    let parsedForm;
    try {
        const result = await getSnowflake(inputList, placeholders);

        parsedForm = readExampleSchema.array().safeParse(result);

        if (!parsedForm.success) {
            return { 
                success: false,
                message: parsedForm.error.message,
                reason: "Invalid Input",
                error: parsedForm.error.flatten().fieldErrors,
            };
        };

    } catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }

    return { 
        success: true,
        message: "Successfully read snowflake.",
        data: parsedForm.data, 
    }
};

async function getExampleTotalPagePG(QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readExample", "readExampleTotalPage");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT example_uid, example, example_created_dt, example_updated_dt, example_updated_by
        FROM "jiajunleeWeb"."example"
        WHERE (CAST(example_uid AS TEXT) LIKE $1 OR example LIKE $1);`,
        [QUERY]
    );
    await pool.end();

    return result;
};

async function getExampleTotalPageMSSQL(QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readExample", "readExampleTotalPage");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('query', sql.VarChar, QUERY)
        .query`SELECT example_uid, example, example_created_dt, example_updated_dt, example_updated_by
                FROM [jiajunleeWeb].[example]
                WHERE (example_uid like @query OR example like @query);
    `;
    await pool.close();

    return result;
};

export async function readExampleTotalPageService(itemsPerPage: number | unknown, query?: string | unknown): Promise<ServerResponse<number>> {

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedQuery = querySchema.parse(query);

    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

    if (!hasWidgetViewAccess) {
        const info = {
            username: session.user.username,
            requestedPath: "/authenticated/example",
            owners,
            viewers,
        };
        const encodedInfo = Buffer.from(JSON.stringify(info)).toString('base64');
        return {
            success: false,
            message: `Access denied. You are not part of the viewers (${viewers}). Kindly contact owners (${owners}) to get access.`,
            reason: "Access Denied",
            data: { encodedInfo: encodedInfo },
        }
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';
    let parsedForm;
    let totalPage;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const result = await getExampleTotalPagePG(QUERY);
            parsedForm = readExampleSchema.array().safeParse(result.rows);
        }

        else {
            const result = await getExampleTotalPageMSSQL(QUERY);
            parsedForm = readExampleSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            return {
                success: false,
                message: parsedForm.error.message,
                reason: "Invalid Output",
                error: parsedForm.error.flatten().fieldErrors,
            }
        };

        totalPage = Math.ceil(parsedForm.data.length / parsedItemsPerPage);
    } 
    catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }
    
    return {
        success: true,
        message: "Successfully read example total page.",
        data: totalPage,
    }
};

async function getExampleByPagePG(QUERY: string, OFFSET: number, parsedItemsPerPage: number) {
    "use cache"
    cacheLife("max");
    cacheTag("readExample", "readExampleByPage");

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
    await pool.end();

    return result;
};

async function getExampleByPageMSSQL(QUERY: string, OFFSET: number, parsedItemsPerPage: number) {
    "use cache"
    cacheLife("max");
    cacheTag("readExample", "readExampleByPage");

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
    await pool.close();

    return result;
};

export async function readExampleByPageService(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown): Promise<ServerResponse<TReadExampleSchema[]>> {

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedCurrentPage = currentPageSchema.parse(currentPage);
    const parsedQuery = querySchema.parse(query);

    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

    if (!hasWidgetViewAccess) {
        const info = {
            username: session.user.username,
            requestedPath: "/authenticated/example",
            owners,
            viewers,
        };
        const encodedInfo = Buffer.from(JSON.stringify(info)).toString('base64');
        return {
            success: false,
            message: `Access denied. You are not part of the viewers (${viewers}). Kindly contact owners (${owners}) to get access.`,
            reason: "Access Denied",
            data: { encodedInfo: encodedInfo },
        }
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }
    
    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';
    const OFFSET = (parsedCurrentPage - 1) * parsedItemsPerPage;
    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const result = await getExampleByPagePG(QUERY, OFFSET, parsedItemsPerPage);
            parsedForm = readExampleSchema.array().safeParse(result.rows);
        }
        
        else {
            const result = await getExampleByPageMSSQL(QUERY, OFFSET, parsedItemsPerPage);
            parsedForm = readExampleSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            return {
                success: false,
                message: parsedForm.error.message,
                reason: "Invalid Output",
                error: parsedForm.error.flatten().fieldErrors,
            }
        };
    } 
    catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }

    return {
        success: true,
        message: "Successfully read example by page.",
        data: parsedForm.data,
    }
};

async function getAllExamplePG() {
    "use cache"
    cacheLife("max");
    cacheTag("readExample", "readAllExample");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') AS example_updated_by
        FROM "jiajunleeWeb"."example" e
        LEFT JOIN "jiajunleeWeb"."user" u ON e.example_updated_by = u.user_uid;`
    );
    await pool.end();

    return result;
};

async function getAllExampleMSSQL() {
    "use cache"
    cacheLife("max");
    cacheTag("readExample", "readAllExample");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .query`SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') as example_updated_by
                FROM [jiajunleeWeb].[example] e
                left join [jiajunleeWeb].[user] u ON e.example_updated_by = u.user_uid
                ;
    `;
    await pool.close();

    return result;
};

export async function readAllExampleService(): Promise<ServerResponse<TReadExampleSchema[]>> {

    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

    if (!hasWidgetViewAccess) {
        const info = {
            username: session.user.username,
            requestedPath: "/authenticated/example",
            owners,
            viewers,
        };
        const encodedInfo = Buffer.from(JSON.stringify(info)).toString('base64');
        return {
            success: false,
            message: `Access denied. You are not part of the viewers (${viewers}). Kindly contact owners (${owners}) to get access.`,
            reason: "Access Denied",
            data: { encodedInfo: encodedInfo },
        }
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const result = await getAllExamplePG();
            parsedForm = readExampleSchema.array().safeParse(result.rows);
        }
        
        else {
            const result = await getAllExampleMSSQL();
            parsedForm = readExampleSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            return {
                success: false,
                message: parsedForm.error.message,
                reason: "Invalid Output",
                error: parsedForm.error.flatten().fieldErrors,
            }
        };
    } 
    catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }

    return {
        success: true,
        message: "Successfully read all example.",
        data: parsedForm.data,
    }
};

async function getExampleUidPG(example: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readExample", "readExampleUid");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') AS example_updated_by
        FROM "jiajunleeWeb"."example" e
        LEFT JOIN "jiajunleeWeb"."user" u ON e.example_updated_by = u.user_uid
        WHERE e.example = $1;`,
        [example]
    );
    await pool.end();

    return result;
};

async function getExampleUidMSSQL(example: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readExample", "readExampleUid");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('example', sql.VarChar, example)
        .query`SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') as example_updated_by
                FROM [jiajunleeWeb].[example] e
                left join [jiajunleeWeb].[user] u ON e.example_updated_by = u.user_uid
                WHERE e.example = @example;
    `;
    await pool.close();

    return result;
};

export async function readExampleUidService(example: string | unknown): Promise<ServerResponse<TReadExampleSchema>> {

    const parsedInput = ExampleSchema.safeParse({
        example: example,
    });

    if (!parsedInput.success) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
            error: parsedInput.error.flatten().fieldErrors,
        }
    };

    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

    if (!hasWidgetViewAccess) {
        const info = {
            username: session.user.username,
            requestedPath: "/authenticated/example",
            owners,
            viewers,
        };
        const encodedInfo = Buffer.from(JSON.stringify(info)).toString('base64');
        return {
            success: false,
            message: `Access denied. You are not part of the viewers (${viewers}). Kindly contact owners (${owners}) to get access.`,
            reason: "Access Denied",
            data: { encodedInfo: encodedInfo },
        }
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const result = await getExampleUidPG(parsedInput.data.example);
            parsedForm = readExampleSchema.safeParse(result.rows[0]);
        }
        
        else {
            const result = await getExampleUidMSSQL(parsedInput.data.example);
            parsedForm = readExampleSchema.safeParse(result.recordset[0]);
        }

        if (!parsedForm.success) {
            return {
                success: false,
                message: parsedForm.error.message,
                reason: "Invalid Output",
                error: parsedForm.error.flatten().fieldErrors,
            }
        };

    } 
    catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }

    return {
        success: true,
        message: `Successfully read example ${parsedForm.data.example_uid}.`,
        data: parsedForm.data,
    }
};

async function getExampleByIdPG(example_uid: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readExample", "readExampleById");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt,
                COALESCE(u.username, 'system') AS example_updated_by
        FROM "jiajunleeWeb"."example" e
        LEFT JOIN "jiajunleeWeb"."user" u ON e.example_updated_by = u.user_uid
        WHERE e.example_uid = $1;`,
        [example_uid]
    );
    await pool.end();

    return result;
};

async function getExampleByIdMSSQL(example_uid: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readExample", "readExampleById");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('example_uid', sql.VarChar, example_uid)
        .query`SELECT e.example_uid, e.example, e.example_created_dt, e.example_updated_dt, COALESCE(u.username, 'system') as example_updated_by
                FROM [jiajunleeWeb].[example] e
                left join [jiajunleeWeb].[user] u ON e.example_updated_by = u.user_uid
                WHERE e.example_uid = @example_uid;
    `;
    await pool.close();

    return result;
};

export async function readExampleByIdService(example_uid: string): Promise<ServerResponse<TReadExampleSchema>> {

    const parsedInput = deleteExampleSchema.safeParse({
        example_uid: example_uid,
    });

    if (!parsedInput.success) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
            error: parsedInput.error.flatten().fieldErrors,
        }
    };

    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

    if (!hasWidgetViewAccess) {
        const info = {
            username: session.user.username,
            requestedPath: "/authenticated/example",
            owners,
            viewers,
        };
        const encodedInfo = Buffer.from(JSON.stringify(info)).toString('base64');
        return {
            success: false,
            message: `Access denied. You are not part of the viewers (${viewers}). Kindly contact owners (${owners}) to get access.`,
            reason: "Access Denied",
            data: { encodedInfo: encodedInfo },
        }
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const result = await getExampleByIdPG(parsedInput.data.example_uid);
            parsedForm = readExampleSchema.safeParse(result.rows[0]);
        }
        
        else {
            const result = await getExampleByIdMSSQL(parsedInput.data.example_uid);
            parsedForm = readExampleSchema.safeParse(result.recordset[0]);
        }

        if (!parsedForm.success) {
            return {
                success: false,
                message: parsedForm.error.message,
                reason: "Invalid Output",
                error: parsedForm.error.flatten().fieldErrors,
            }
        };

    } 
    catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }

    return {
        success: true,
        message: `Successfully read example ${parsedForm.data.example_uid}.`,
        data: parsedForm.data,
    }
};

export async function createExampleService(formData: FormData | unknown): Promise<ServerResponse<undefined>> {

    if (!(formData instanceof FormData)) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
        }
    };

    const now = new Date();

    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

    if (!hasWidgetViewAccess) {
        return { 
            success: false,
            message: `Access denied. You are not part of the viewers (${viewers}). Kindly contact owners (${owners}) to get access.`,
            reason: "Access Denied",
        };
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
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
            success: false,
            message: parsedForm.error.message,
            reason: "Invalid Input",
            error: parsedForm.error.flatten().fieldErrors,
            data: Object.fromEntries(
                Object.entries(Object.fromEntries(formData.entries())).map(([k, v]) => [k, v.toString()])
            ),
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
                            .input('example_uid', sql.UniqueIdentifier, parsedForm.data.example_uid)
                            .input('example', sql.VarChar, parsedForm.data.example)
                            .input('example_created_dt', sql.DateTime, parsedForm.data.example_created_dt)
                            .input('example_updated_dt', sql.DateTime, parsedForm.data.example_updated_dt)
                            .input('example_updated_by', sql.VarChar, parsedForm.data.example_updated_by)
                            .query`INSERT INTO [jiajunleeWeb].[example] 
                                    (example_uid, example, example_created_dt, example_updated_dt, example_updated_by)
                                    VALUES (@example_uid, @example, @example_created_dt, @example_updated_dt, @example_updated_by);
                            `;
            await pool.close();
        }
    } 
    catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }

    return { 
        success: true,
        message: `Successfully created example ${parsedForm.data.example_uid}`,
        data: undefined,
    }
};

export async function updateExampleService(formData: FormData | unknown): Promise<ServerResponse<undefined>> {

    if (!(formData instanceof FormData)) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
        }
    };

    const now = new Date();

    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

    if (!hasWidgetViewAccess) {
        return { 
            success: false,
            message: `Access denied. You are not part of the viewers (${viewers}). Kindly contact owners (${owners}) to get access.`,
            reason: "Access Denied",
        };
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    const parsedForm = updateExampleSchema.safeParse({
        example_uid: formData.get('example_uid'),
        example_updated_dt: now,
        example_updated_by: session.user.user_uid,
    });

    if (!parsedForm.success) {
        return { 
            success: false,
            message: parsedForm.error.message,
            reason: "Invalid Input",
            error: parsedForm.error.flatten().fieldErrors,
            data: Object.fromEntries(
                Object.entries(Object.fromEntries(formData.entries())).map(([k, v]) => [k, v.toString()])
            ),
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
                            .input('example_uid', sql.UniqueIdentifier, parsedForm.data.example_uid)
                            .input('example_updated_dt', sql.DateTime, parsedForm.data.example_updated_dt)
                            .input('example_updated_by', sql.VarChar, parsedForm.data.example_updated_by)
                            .query`UPDATE [jiajunleeWeb].[example] 
                                    SET example_updated_dt = @example_updated_dt, example_updated_by = @example_updated_by
                                    WHERE example_uid = @example_uid;
                            `;
            await pool.close();
        }
    } 
    catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }

    return { 
        success: true,
        message: `Successfully updated example ${parsedForm.data.example_uid}`,
        data: undefined,
    }
};

export async function deleteExampleService(example_uid: string): Promise<ServerResponse<undefined>> {

    const parsedForm = deleteExampleSchema.safeParse({
        example_uid: example_uid,
    });

    if (!parsedForm.success) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
            error: parsedForm.error.flatten().fieldErrors,
        }
    };

    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

    if (!hasWidgetViewAccess) {
        return { 
            success: false,
            message: `Access denied. You are not part of the viewers (${viewers}). Kindly contact owners (${owners}) to get access.`,
            reason: "Access Denied",
        };
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
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
                            .input('example_uid', sql.UniqueIdentifier, parsedForm.data.example_uid)
                            .query`DELETE FROM [jiajunleeWeb].[example] 
                                    WHERE example_uid = @example_uid;
                            `;
            await pool.close();
        }
    } 
    catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }

    return { 
        success: true,
        message: `Successfully deleted example ${parsedForm.data.example_uid}`,
        data: undefined, 
    }
};