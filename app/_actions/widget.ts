'use server'

import { rateLimitByIP, rateLimitByUid } from "@/app/_libs/rate_limit";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { redirect } from "next/navigation";
import { v5 as uuidv5 } from 'uuid';
import sql from 'mssql';
import { Pool } from 'pg';
import { pgSqlConfig, msSqlConfig } from "@/app/_libs/sql_config";
import { readWidgetSchema, createWidgetSchema, updateWidgetSchema, deleteWidgetSchema, WidgetSchema } from "@/app/_libs/zod_server";
import { itemsPerPageSchema, currentPageSchema, querySchema } from '@/app/_libs/zod_server';
import { parsedEnv } from '@/app/_libs/zod_env';
import { getErrorMessage } from '@/app/_libs/error_handler';
import { StatePromise, type State } from '@/app/_libs/types';
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag, revalidateTag } from 'next/cache'; 
import { checkWidgetAccess } from "@/app/_libs/widgets";

const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);

export async function getWidgetTotalPagePG(pool: Pool, QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetTotalPage");

    const result = await pool.query(
        `SELECT widget_uid, widget_name, widget_description, widget_group, widget_href, widget_tabs, widget_owners, widget_viewers, widget_created_dt, widget_updated_dt, widget_updated_by
        FROM "jiajunleeWeb"."widget"
        WHERE (CAST(widget_uid AS TEXT) LIKE $1 OR widget_name LIKE $1 OR widget_group LIKE $1 OR widget_href LIKE $1);`,
        [QUERY]
    );

    return result;
};

export async function getWidgetTotalPageMSSQL(pool: sql.ConnectionPool, QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetTotalPage");

    const result = await pool.request()
        .input('query', sql.VarChar, QUERY)
        .query`SELECT widget_uid, widget_name, widget_description, widget_group, widget_href, widget_tabs, widget_owners, widget_viewers, widget_created_dt, widget_updated_dt, widget_updated_by
                FROM [jiajunleeWeb].[widget]
                WHERE (widget_uid like @query OR widget_name like @query OR widget_group like @query OR widget_href like @query);
    `;

    return result;
};

export async function readWidgetTotalPage(itemsPerPage: number | unknown, query?: string | unknown) {

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedQuery = querySchema.parse(query);

    const session = await getServerSession(options);

    if (!session) {
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
            const result = await getWidgetTotalPagePG(pool, QUERY);
            parsedForm = readWidgetSchema.array().safeParse(result.rows.map(row => ({
                ...row,
                widget_tabs: row.widget_tabs ? JSON.parse(row.widget_tabs) : [],
                widget_owners: row.widget_owners ? row.widget_owners.split(',') : [],
                widget_viewers: row.widget_viewers ? row.widget_viewers.split(',') : [],
            })));
            await pool.end();
        }

        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await getWidgetTotalPageMSSQL(pool, QUERY);
            parsedForm = readWidgetSchema.array().safeParse(result.recordset.map(row => ({
                ...row,
                widget_tabs: row.widget_tabs ? JSON.parse(row.widget_tabs) : [],
                widget_owners: row.widget_owners ? row.widget_owners.split(',') : [],
                widget_viewers: row.widget_viewers ? row.widget_viewers.split(',') : [],
            })));
        }

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }
    
    // User can only read those widgets with hasWidgetOwnerAccess
    const accessChecks = await Promise.all(
        parsedForm.data.map(widget => checkWidgetAccess(parsedEnv.BASE_URL, widget.widget_href, session.user.username, session.user.role))
    )
    const ownedWidgets = parsedForm.data.filter((_, i) => accessChecks[i].hasWidgetOwnerAccess);
    const totalPage = Math.ceil(ownedWidgets.length / parsedItemsPerPage);
    return totalPage
};

export async function getWidgetByPagePG(pool: Pool, QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetByPage");

    const result = await pool.query(
        `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') AS widget_updated_by
        FROM "jiajunleeWeb"."widget" w
        LEFT JOIN "jiajunleeWeb"."user" u ON w.widget_updated_by = u.user_uid
        WHERE (CAST(w.widget_uid AS TEXT) LIKE $1 OR w.widget_name LIKE $1 OR w.widget_group LIKE $1 OR w.widget_href LIKE $1)
        ORDER BY w.widget_group ASC
        `,
        [QUERY]
    );

    return result;
};

export async function getWidgetByPageMSSQL(pool: sql.ConnectionPool, QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetByPage");

    const result = await pool.request()
        .input('query', sql.VarChar, QUERY)
        .query`SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') as widget_updated_by
                FROM [jiajunleeWeb].[widget] w
                left join [jiajunleeWeb].[user] u ON w.widget_updated_by = u.user_uid
                WHERE (w.widget_uid like @query OR w.widget_name like @query OR w.widget_group like @query OR w.widget_href like @query)
                ORDER BY w.widget_group asc
                ;
    `;

    return result;
};

export async function readWidgetByPage(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown) {

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedCurrentPage = currentPageSchema.parse(currentPage);
    const parsedQuery = querySchema.parse(query);

    const session = await getServerSession(options);

    if (!session) {
        redirect("/denied");
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
        redirect(`/denied?info=${encodedInfo}`);
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
            const result = await getWidgetByPagePG(pool, QUERY);
            parsedForm = readWidgetSchema.array().safeParse(result.rows.map(row => ({
                ...row,
                widget_tabs: row.widget_tabs ? JSON.parse(row.widget_tabs) : [],
                widget_owners: row.widget_owners ? row.widget_owners.split(',') : [],
                widget_viewers: row.widget_viewers ? row.widget_viewers.split(',') : [],
            })));
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await getWidgetByPageMSSQL(pool, QUERY);
            parsedForm = readWidgetSchema.array().safeParse(result.recordset.map(row => ({
                ...row,
                widget_tabs: row.widget_tabs ? JSON.parse(row.widget_tabs) : [],
                widget_owners: row.widget_owners ? row.widget_owners.split(',') : [],
                widget_viewers: row.widget_viewers ? row.widget_viewers.split(',') : [],
            })));
        }

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    // User can only read those widgets with hasWidgetOwnerAccess
    const accessChecks = await Promise.all(
        parsedForm.data.map(widget => checkWidgetAccess(parsedEnv.BASE_URL, widget.widget_href, session.user.username, session.user.role))
    )
    const ownedWidgets = parsedForm.data.filter((_, i) => accessChecks[i].hasWidgetOwnerAccess);

    return ownedWidgets.slice(OFFSET, OFFSET + parsedItemsPerPage)
};

export async function getAllWidgetPG(pool: Pool) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readAllWidget");

    const result = await pool.query(
        `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') AS widget_updated_by
        FROM "jiajunleeWeb"."widget" w
        LEFT JOIN "jiajunleeWeb"."user" u ON w.widget_updated_by = u.user_uid;`
    );

    return result;
};

export async function getAllWidgetMSSQL(pool: sql.ConnectionPool) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readAllWidget");

    const result = await pool.request()
        .query`SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') as widget_updated_by
                FROM [jiajunleeWeb].[widget] w
                left join [jiajunleeWeb].[user] u ON w.widget_updated_by = u.user_uid
                ;
    `;

    return result;
};

export async function readAllWidget() {

    const session = await getServerSession(options);

    if (!session) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await getAllWidgetPG(pool);
            parsedForm = readWidgetSchema.array().safeParse(result.rows.map(row => ({
                ...row,
                widget_tabs: row.widget_tabs ? JSON.parse(row.widget_tabs) : [],
                widget_owners: row.widget_owners ? row.widget_owners.split(',') : [],
                widget_viewers: row.widget_viewers ? row.widget_viewers.split(',') : [],
            })));
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await getAllWidgetMSSQL(pool);
            parsedForm = readWidgetSchema.array().safeParse(result.recordset.map(row => ({
                ...row,
                widget_tabs: row.widget_tabs ? JSON.parse(row.widget_tabs) : [],
                widget_owners: row.widget_owners ? row.widget_owners.split(',') : [],
                widget_viewers: row.widget_viewers ? row.widget_viewers.split(',') : [],
            })));
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

export async function getWidgetUidPG(pool: Pool, widget_href: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetUid");

    const result = await pool.query(
        `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') AS widget_updated_by
        FROM "jiajunleeWeb"."widget" w
        LEFT JOIN "jiajunleeWeb"."user" u ON w.widget_updated_by = u.user_uid
        WHERE w.widget_href = $1;`,
        [widget_href]
    );

    return result;
};

export async function getWidgetUidMSSQL(pool: sql.ConnectionPool, widget_href: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetUid");

    const result = await pool.request()
        .input('widget_href', sql.VarChar, widget_href)
        .query`SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, COALESCE(u.username, 'system') as widget_updated_by
                FROM [jiajunleeWeb].[widget] w
                left join [jiajunleeWeb].[user] u ON w.widget_updated_by = u.user_uid
                WHERE w.widget_href = @widget_href;
    `;

    return result;
};

export async function readWidgetUid(widget_href: string | unknown) {

    const parsedInput = WidgetSchema.safeParse({
        widget_href: widget_href,
    });

    if (!parsedInput.success) {
        throw new Error(parsedInput.error.message)
    };

    const session = await getServerSession(options);

    if (!session) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await getWidgetUidPG(pool, parsedInput.data.widget_href);
            const row = result.rows[0];
            parsedForm = readWidgetSchema.safeParse({
                ...row,
                widget_tabs: row.widget_tabs ? JSON.parse(row.widget_tabs) : [],
                widget_owners: row.widget_owners ? row.widget_owners.split(',') : [],
                widget_viewers: row.widget_viewers ? row.widget_viewers.split(',') : [],
            });
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await getWidgetUidMSSQL(pool, parsedInput.data.widget_href);
            const row = result.recordset[0];
            parsedForm = readWidgetSchema.safeParse({
                ...row,
                widget_tabs: row.widget_tabs ? JSON.parse(row.widget_tabs) : [],
                widget_owners: row.widget_owners ? row.widget_owners.split(',') : [],
                widget_viewers: row.widget_viewers ? row.widget_viewers.split(',') : [],
            });
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

export async function createWidget(prevState: State | unknown, formData: FormData | unknown): StatePromise {

    if (!(formData instanceof FormData)) {
        return { 
            error: {error: ["Invalid input provided !"]},
            message: "Invalid input provided !"
        };  
    };

    const now = new Date();

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return { 
            error: {error: ["Too many requests, try again later."]},
            message: "Too many requests, try again later."
        };
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
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to create widget!",
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
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: getErrorMessage(err)
        }
    }

    revalidateTag("readWidget");

    return { 
        message: `Successfully created widget ${parsedForm.data.widget_uid}` 
    }
};


export async function updateWidget(prevState: State | unknown, formData: FormData | unknown): StatePromise {

    if (!(formData instanceof FormData)) {
        return { 
            error: {error: ["Invalid input provided !"]},
            message: "Invalid input provided !"
        };  
    };

    const now = new Date();

    const session = await getServerSession(options);

    if (!session) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return { 
            error: {error: ["Too many requests, try again later."]},
            message: "Too many requests, try again later."
        };
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
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to update widget!",
            data: Object.fromEntries(
                Object.entries(Object.fromEntries(formData.entries())).map(([k, v]) => [k, v.toString()])
            ),
        };
    };

    let widgetHref: string | undefined;
    try {
        const widgetData = await readWidgetByUid(parsedForm.data.widget_uid);
        widgetHref = widgetData?.widget_href ?? undefined;
    } catch {
        return {
            error: { error: ["Widget not found, failed to update widget!"]},
            message: "Widget not found, failed to update widget!",
        };
    }

    const { hasWidgetOwnerAccess, owners } = await checkWidgetAccess(parsedEnv.BASE_URL, widgetHref, session.user.username, session.user.role);

    if (!hasWidgetOwnerAccess) {
        return {
            error: { error: [`Access denied. You are not part of the owners (${owners}).`]},
            message: `Access denied. You are not part of the owners (${owners}).`,
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
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: getErrorMessage(err)
        }
    }

    revalidateTag("readWidget");

    return { message: `Successfully updated widget ${parsedForm.data.widget_uid}` }
};


export async function deleteWidget(widget_uid: string): StatePromise {

    const parsedForm = deleteWidgetSchema.safeParse({
        widget_uid: widget_uid,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to delete widget!"
        };
    };

    const session = await getServerSession(options);

    if (!session) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        return { 
            error: {error: ["Too many requests, try again later."]},
            message: "Too many requests, try again later."
        };
    }

    let widgetHref: string | undefined;
    try {
        const widgetData = await readWidgetByUid(parsedForm.data.widget_uid);
        widgetHref = widgetData?.widget_href ?? undefined;
    } catch {
        return {
            error: { error: ["Widget not found, failed to delete widget!"]},
            message: "Widget not found, failed to delete widget!",
        };
    }

    const { hasWidgetOwnerAccess, owners } = await checkWidgetAccess(parsedEnv.BASE_URL, widgetHref, session.user.username, session.user.role);

    if (!hasWidgetOwnerAccess) {
        return {
            error: { error: [`Access denied. You are not part of the owners (${owners}).`]},
            message: `Access denied. You are not part of the owners (${owners}).`,
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
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: getErrorMessage(err)
        }
    }

    revalidateTag("readWidget");

    return { message: `Successfully deleted widget ${parsedForm.data.widget_uid}` }
};

export async function getWidgetByUidPG(pool: Pool, widget_uid: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetByUid");

    const result = await pool.query(
        `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt,
                COALESCE(u.username, 'system') AS widget_updated_by
        FROM "jiajunleeWeb"."widget" w
        LEFT JOIN "jiajunleeWeb"."user" u ON w.widget_updated_by = u.user_uid
        WHERE w.widget_uid = $1;`,
        [widget_uid]
    );

    return result;
};

export async function getWidgetByUidMSSQL(pool: sql.ConnectionPool, widget_uid: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgetByUid");

    const result = await pool.request()
        .input('widget_uid', sql.VarChar, widget_uid)
        .query`SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers, w.widget_created_dt, w.widget_updated_dt, 
                COALESCE(u.username, 'system') as widget_updated_by
                FROM [jiajunleeWeb].[widget] w
                left join [jiajunleeWeb].[user] u ON w.widget_updated_by = u.user_uid
                WHERE w.widget_uid = @widget_uid;
    `;

    return result;
};

export async function readWidgetByUid(widget_uid: string) {

    const parsedInput = deleteWidgetSchema.safeParse({
        widget_uid: widget_uid,
    });

    if (!parsedInput.success) {
        throw new Error(parsedInput.error.message)
    };

    const session = await getServerSession(options);

    if (!session) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await getWidgetByUidPG(pool, parsedInput.data.widget_uid);
            const row = result.rows[0];
            parsedForm = readWidgetSchema.safeParse({
                ...row,
                widget_tabs: row.widget_tabs ? JSON.parse(row.widget_tabs) : [],
                widget_owners: row.widget_owners ? row.widget_owners.split(',') : [],
                widget_viewers: row.widget_viewers ? row.widget_viewers.split(',') : [],
            });
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await getWidgetByUidMSSQL(pool, parsedInput.data.widget_uid);
            const row = result.recordset[0];
            parsedForm = readWidgetSchema.safeParse({
                ...row,
                widget_tabs: row.widget_tabs ? JSON.parse(row.widget_tabs) : [],
                widget_owners: row.widget_owners ? row.widget_owners.split(',') : [],
                widget_viewers: row.widget_viewers ? row.widget_viewers.split(',') : [],
            });
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