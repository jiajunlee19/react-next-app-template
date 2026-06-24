import "server-only";

import { rateLimitByIP, rateLimitByUid } from "@/app/_libs/rate_limit";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { v5 as uuidv5 } from 'uuid';
import sql from 'mssql';
import { Pool } from 'pg';
import { pgSqlConfig, msSqlConfig } from "@/app/_libs/sql_config";
import { readWidgetSchema, createWidgetSchema, updateWidgetSchema, deleteWidgetSchema, WidgetSchema, type TReadWidgetSchema } from "@/app/_libs/zod_server";
import { itemsPerPageSchema, currentPageSchema, querySchema } from '@/app/_libs/zod_server';
import { parsedEnv } from '@/app/_libs/zod_env';
import { getErrorMessage } from '@/app/_libs/error_handler';
import { type ServerResponse } from '@/app/_libs/types';
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag, revalidateTag } from 'next/cache'; 
import { checkWidgetAccess } from "@/app/_libs/widgets";

const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);

async function getWidgetTotalPagePG(QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetTotalPage");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT widget_uid, widget_name, widget_description, widget_group, widget_href, widget_tabs, widget_owners, widget_viewers, widget_created_dt, widget_updated_dt, widget_updated_by
        FROM "jiajunleeWeb"."widget"
        WHERE (CAST(widget_uid AS TEXT) LIKE $1 OR widget_name LIKE $1 OR widget_group LIKE $1 OR widget_href LIKE $1);`,
        [QUERY]
    );
    await pool.end();

    return result;
};

async function getWidgetTotalPageMSSQL(QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetTotalPage");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('query', sql.VarChar, QUERY)
        .query`SELECT widget_uid, widget_name, widget_description, widget_group, widget_href, widget_tabs, widget_owners, widget_viewers, widget_created_dt, widget_updated_dt, widget_updated_by
                FROM [jiajunleeWeb].[widget]
                WHERE (widget_uid like @query OR widget_name like @query OR widget_group like @query OR widget_href like @query);
    `;
    await pool.close();

    return result;
};

export async function readWidgetTotalPageService(itemsPerPage: number | unknown, query?: string | unknown): Promise<ServerResponse<number>> {

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
            const result = await getWidgetTotalPagePG(QUERY);
            parsedForm = readWidgetSchema.array().safeParse(result.rows);
        }

        else {
            const result = await getWidgetTotalPageMSSQL(QUERY);
            parsedForm = readWidgetSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            return {
                success: false,
                message: parsedForm.error.message,
                reason: "Invalid Output",
                error: parsedForm.error.flatten().fieldErrors,
            }
        };

        // User can only read those widgets with hasWidgetOwnerAccess
        const accessChecks = await Promise.all(
            parsedForm.data.map(widget => checkWidgetAccess(parsedEnv.BASE_URL, widget.widget_href, session.user.username, session.user.role))
        )
        const ownedWidgets = parsedForm.data.filter((_, i) => accessChecks[i].hasWidgetOwnerAccess);
        totalPage = Math.ceil(ownedWidgets.length / parsedItemsPerPage);
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
        message: "Successfully read widget total page.",
        data: totalPage,
    }
};

async function getWidgetByPagePG(QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetByPage");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') AS widget_updated_by
        FROM "jiajunleeWeb"."widget" w
        LEFT JOIN "jiajunleeWeb"."user" u ON w.widget_updated_by = u.user_uid
        WHERE (CAST(w.widget_uid AS TEXT) LIKE $1 OR w.widget_name LIKE $1 OR w.widget_group LIKE $1 OR w.widget_href LIKE $1)
        ORDER BY w.widget_group ASC
        `,
        [QUERY]
    );
    await pool.end();

    return result;
};

async function getWidgetByPageMSSQL(QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetByPage");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('query', sql.VarChar, QUERY)
        .query`SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') as widget_updated_by
                FROM [jiajunleeWeb].[widget] w
                left join [jiajunleeWeb].[user] u ON w.widget_updated_by = u.user_uid
                WHERE (w.widget_uid like @query OR w.widget_name like @query OR w.widget_group like @query OR w.widget_href like @query)
                ORDER BY w.widget_group asc
                ;
    `;
    await pool.close();

    return result;
};

export async function readWidgetByPageService(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown): Promise<ServerResponse<TReadWidgetSchema[]>> {

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

    const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/widget", session.user.username, session.user.role);

    if (!hasWidgetViewAccess) {
        const info = {
            username: session.user.username,
            requestedPath: "/authenticated/widget",
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
    let ownedWidgets;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const result = await getWidgetByPagePG(QUERY);
            parsedForm = readWidgetSchema.array().safeParse(result.rows);
        }
        
        else {
            const result = await getWidgetByPageMSSQL(QUERY);
            parsedForm = readWidgetSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            return {
                success: false,
                message: parsedForm.error.message,
                reason: "Invalid Output",
                error: parsedForm.error.flatten().fieldErrors,
            }
        };

        // User can only read those widgets with hasWidgetOwnerAccess
        const accessChecks = await Promise.all(
            parsedForm.data.map(widget => checkWidgetAccess(parsedEnv.BASE_URL, widget.widget_href, session.user.username, session.user.role))
        )
        ownedWidgets = parsedForm.data.filter((_, i) => accessChecks[i].hasWidgetOwnerAccess);
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
        message: "Successfully read widget by page.",
        data: ownedWidgets.slice(OFFSET, OFFSET + parsedItemsPerPage),
    }
};

async function getAllWidgetPG() {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readAllWidget");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') AS widget_updated_by
        FROM "jiajunleeWeb"."widget" w
        LEFT JOIN "jiajunleeWeb"."user" u ON w.widget_updated_by = u.user_uid;`
    );
    await pool.end();

    return result;
};

async function getAllWidgetMSSQL() {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readAllWidget");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .query`SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') as widget_updated_by
                FROM [jiajunleeWeb].[widget] w
                left join [jiajunleeWeb].[user] u ON w.widget_updated_by = u.user_uid
                ;
    `;
    await pool.close();

    return result;
};

export async function readAllWidgetService(): Promise<ServerResponse<TReadWidgetSchema[]>> {

    const session = await getServerSession(options);

    if (!session) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
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
            const result = await getAllWidgetPG();
            parsedForm = readWidgetSchema.array().safeParse(result.rows);
        }
        
        else {
            const result = await getAllWidgetMSSQL();
            parsedForm = readWidgetSchema.array().safeParse(result.recordset);
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
        message: "Successfully read all widget.",
        data: parsedForm.data,
    }
};

async function getWidgetUidPG(widget_href: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetUid");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') AS widget_updated_by
        FROM "jiajunleeWeb"."widget" w
        LEFT JOIN "jiajunleeWeb"."user" u ON w.widget_updated_by = u.user_uid
        WHERE w.widget_href = $1;`,
        [widget_href]
    );
    await pool.end();

    return result;
};

async function getWidgetUidMSSQL(widget_href: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetUid");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('widget_href', sql.VarChar, widget_href)
        .query`SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') as widget_updated_by
                FROM [jiajunleeWeb].[widget] w
                left join [jiajunleeWeb].[user] u ON w.widget_updated_by = u.user_uid
                WHERE w.widget_href = @widget_href;
    `;
    await pool.close();

    return result;
};

export async function readWidgetUidService(widget_href: string | unknown): Promise<ServerResponse<TReadWidgetSchema>> {

    const parsedInput = WidgetSchema.safeParse({
        widget_href: widget_href,
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
            const result = await getWidgetUidPG(parsedInput.data.widget_href);
            const row = result.rows[0];
            parsedForm = readWidgetSchema.safeParse(row);
        }
        
        else {
            const result = await getWidgetUidMSSQL(parsedInput.data.widget_href);
            const row = result.recordset[0];
            parsedForm = readWidgetSchema.safeParse(row);
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
        message: `Successfully read widget ${parsedForm.data.widget_uid}.`,
        data: parsedForm.data,
    }
};

async function getWidgetByUidPG(widget_uid: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetByUid");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt,
                COALESCE(u.username, 'system') AS widget_updated_by
        FROM "jiajunleeWeb"."widget" w
        LEFT JOIN "jiajunleeWeb"."user" u ON w.widget_updated_by = u.user_uid
        WHERE w.widget_uid = $1;`,
        [widget_uid]
    );
    await pool.end();

    return result;
};

async function getWidgetByUidMSSQL(widget_uid: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetByUid");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('widget_uid', sql.VarChar, widget_uid)
        .query`SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, 
                COALESCE(u.username, 'system') as widget_updated_by
                FROM [jiajunleeWeb].[widget] w
                left join [jiajunleeWeb].[user] u ON w.widget_updated_by = u.user_uid
                WHERE w.widget_uid = @widget_uid;
    `;
    await pool.close();

    return result;
};

export async function readWidgetByUidService(widget_uid: string): Promise<ServerResponse<TReadWidgetSchema>> {

    const parsedInput = deleteWidgetSchema.safeParse({
        widget_uid: widget_uid,
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
            const result = await getWidgetByUidPG(parsedInput.data.widget_uid);
            const row = result.rows[0];
            parsedForm = readWidgetSchema.safeParse(row);
        }
        
        else {
            const result = await getWidgetByUidMSSQL(parsedInput.data.widget_uid);
            const row = result.recordset[0];
            parsedForm = readWidgetSchema.safeParse(row);
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
        message: `Successfully read widget ${parsedForm.data.widget_uid}.`,
        data: parsedForm.data,
    }
};

export async function createWidgetService(formData: FormData | unknown): Promise<ServerResponse<undefined>> {

    if (!(formData instanceof FormData)) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
        }
    };

    const now = new Date();

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        return {
            success: false,
            message: "You are unauthenticated.",
            reason: "Unauthenticated",
        }
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    const widget_href = formData.get('widget_href');
    const parsedForm = createWidgetSchema.safeParse({
        widget_uid: (typeof widget_href == 'string') ? uuidv5(widget_href, UUID5_SECRET) : undefined,
        widget_name: formData.get('widget_name'),
        widget_description: formData.get('widget_description'),
        widget_group: formData.get('widget_group'),
        widget_href: widget_href,
        widget_tabs: formData.get('widget_tabs'),
        widget_owners: formData.get('widget_owners'),
        widget_viewers: formData.get('widget_viewers'),
        widget_created_dt: now,
        widget_updated_dt: now,
        widget_updated_by: session.user.user_uid,
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
                            `INSERT INTO "jiajunleeWeb"."widget"
                            (
                                widget_uid, 
                                widget_name,
                                widget_description,
                                widget_group,
                                widget_href,
                                widget_tabs,
                                widget_owners,
                                widget_viewers, 
                                widget_created_dt, 
                                widget_updated_dt, 
                                widget_updated_by
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
                            [
                                parsedForm.data.widget_uid, 
                                parsedForm.data.widget_name,
                                parsedForm.data.widget_description,
                                parsedForm.data.widget_group,
                                parsedForm.data.widget_href,
                                parsedForm.data.widget_tabs,
                                parsedForm.data.widget_owners,
                                parsedForm.data.widget_viewers,
                                parsedForm.data.widget_created_dt, 
                                parsedForm.data.widget_updated_dt, 
                                parsedForm.data.widget_updated_by
                            ]
            );
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('widget_uid', sql.UniqueIdentifier, parsedForm.data.widget_uid)
                            .input('widget_name', sql.VarChar, parsedForm.data.widget_name)
                            .input('widget_description', sql.VarChar, parsedForm.data.widget_description)
                            .input('widget_group', sql.VarChar, parsedForm.data.widget_group)
                            .input('widget_href', sql.VarChar, parsedForm.data.widget_href)
                            .input('widget_tabs', sql.VarChar, parsedForm.data.widget_tabs)
                            .input('widget_owners', sql.VarChar, parsedForm.data.widget_owners)
                            .input('widget_viewers', sql.VarChar, parsedForm.data.widget_viewers)
                            .input('widget_created_dt', sql.DateTime, parsedForm.data.widget_created_dt)
                            .input('widget_updated_dt', sql.DateTime, parsedForm.data.widget_updated_dt)
                            .input('widget_updated_by', sql.VarChar, parsedForm.data.widget_updated_by)
                            .query`INSERT INTO [jiajunleeWeb].[widget] 
                                    (
                                        widget_uid, 
                                        widget_name, 
                                        widget_description,
                                        widget_group,
                                        widget_href,
                                        widget_tabs,
                                        widget_owners,
                                        widget_viewers,
                                        widget_created_dt, 
                                        widget_updated_dt, 
                                        widget_updated_by
                                    )
                                    VALUES (
                                        @widget_uid, 
                                        @widget_name, 
                                        @widget_description,
                                        @widget_group,
                                        @widget_href,
                                        @widget_tabs,
                                        @widget_owners,
                                        @widget_viewers,
                                        @widget_created_dt, 
                                        @widget_updated_dt, 
                                        @widget_updated_by
                                    );
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

    revalidateTag("readWidget");

    return { 
        success: true,
        message: `Successfully created widget ${parsedForm.data.widget_uid}.`,
        data: undefined,
    }
};


export async function updateWidgetService(formData: FormData | unknown): Promise<ServerResponse<undefined>> {

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

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    const parsedForm = updateWidgetSchema.safeParse({
        widget_uid: formData.get('widget_uid'),
        widget_name: formData.get('widget_name'),
        widget_description: formData.get('widget_description'),
        widget_group: formData.get('widget_group'),
        widget_tabs: formData.get('widget_tabs'),
        widget_owners: formData.get('widget_owners'),
        widget_viewers: formData.get('widget_viewers'),
        widget_updated_dt: now,
        widget_updated_by: session.user.user_uid,
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

    const resWidget = await readWidgetByUidService(parsedForm.data.widget_uid);
    if (!(resWidget.success)) {
        return resWidget
    }

    const widgetHref = resWidget.data.widget_href;
    const { hasWidgetOwnerAccess, owners } = await checkWidgetAccess(parsedEnv.BASE_URL, widgetHref, session.user.username, session.user.role);

    if (!hasWidgetOwnerAccess) {
        return {
            success: false,
            message: `Access denied. You are not part of the owners (${owners}).`,
            reason: "Access Denied",
        };
    }

    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `UPDATE "jiajunleeWeb"."widget"
                            SET 
                                widget_name = $2, 
                                widget_description = $3,
                                widget_group = $4,
                                widget_tabs = $5,
                                widget_owners = $6,
                                widget_viewers = $7,
                                widget_updated_dt = $8,
                                widget_updated_by = $9
                            WHERE widget_uid = $1;`,
                            [
                                parsedForm.data.widget_uid, 
                                parsedForm.data.widget_name,
                                parsedForm.data.widget_description,
                                parsedForm.data.widget_group,
                                parsedForm.data.widget_tabs,
                                parsedForm.data.widget_owners,
                                parsedForm.data.widget_viewers,
                                parsedForm.data.widget_updated_dt, 
                                parsedForm.data.widget_updated_by
                            ]
            );
            await pool.end();
        }

        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('widget_uid', sql.UniqueIdentifier, parsedForm.data.widget_uid)
                            .input('widget_name', sql.VarChar, parsedForm.data.widget_name)
                            .input('widget_description', sql.VarChar, parsedForm.data.widget_description)
                            .input('widget_group', sql.VarChar, parsedForm.data.widget_group )
                            .input('widget_tabs', sql.VarChar, parsedForm.data.widget_tabs)
                            .input('widget_owners', sql.VarChar, parsedForm.data.widget_owners)
                            .input('widget_viewers', sql.VarChar, parsedForm.data.widget_viewers)
                            .input('widget_updated_dt', sql.DateTime, parsedForm.data.widget_updated_dt)
                            .input('widget_updated_by', sql.VarChar, parsedForm.data.widget_updated_by)
                            .query`UPDATE [jiajunleeWeb].[widget] 
                                    SET 
                                        widget_name = @widget_name,
                                        widget_description = @widget_description,
                                        widget_group = @widget_group,
                                        widget_tabs = @widget_tabs,
                                        widget_owners = @widget_owners,
                                        widget_viewers = @widget_viewers,
                                        widget_updated_dt = @widget_updated_dt, 
                                        widget_updated_by = @widget_updated_by
                                    WHERE widget_uid = @widget_uid;
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

    revalidateTag("readWidget");

    return { 
        success: true,
        message: `Successfully updated widget ${parsedForm.data.widget_uid}.`,
        data: undefined,
    }
};


export async function deleteWidgetService(widget_uid: string): Promise<ServerResponse<undefined>> {

    const parsedForm = deleteWidgetSchema.safeParse({
        widget_uid: widget_uid,
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

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    const resWidget = await readWidgetByUidService(parsedForm.data.widget_uid);
    if (!(resWidget.success)) {
        return resWidget
    }

    const widgetHref = resWidget.data.widget_href;
    const { hasWidgetOwnerAccess, owners } = await checkWidgetAccess(parsedEnv.BASE_URL, widgetHref, session.user.username, session.user.role);

    if (!hasWidgetOwnerAccess) {
        return {
            success: false,
            message: `Access denied. You are not part of the owners (${owners}).`,
            reason: "Access Denied",
        };
    }

    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `DELETE FROM "jiajunleeWeb"."widget"
                            WHERE widget_uid = $1;`,
                            [parsedForm.data.widget_uid]
            );
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('widget_uid', sql.UniqueIdentifier, parsedForm.data.widget_uid)
                            .query`DELETE FROM [jiajunleeWeb].[widget] 
                                    WHERE widget_uid = @widget_uid;
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

    revalidateTag("readWidget");

    return { 
        success: true,
        message: `Successfully deleted widget ${parsedForm.data.widget_uid}.`,
        data: undefined,
    }
};