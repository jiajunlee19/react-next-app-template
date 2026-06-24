import "server-only";

import { rateLimitByIP, rateLimitByUid } from "@/app/_libs/rate_limit";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { v5 as uuidv5 } from 'uuid';
import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { Pool } from 'pg';
import { pgSqlConfig, msSqlConfig } from "@/app/_libs/sql_config";
import { type TUsernameSchema, type TPasswordSchema, signInSchema, signInWithoutPassSchema, signUpSchema, readUserSchema, readUserWithoutPassSchema, updateUserSchema, deleteUserSchema, updateRoleSchema, updateRoleAdminSchema, readUserWithoutPassAdminSchema, type TReadUserSchema, type TReadUserWithTokenSchema } from "@/app/_libs/zod_auth";
import { itemsPerPageSchema, currentPageSchema, querySchema } from '@/app/_libs/zod_server';
import { getErrorMessage } from '@/app/_libs/error_handler';
import { signJwtToken } from '@/app/_libs/jwt';
import { parsedEnv } from '@/app/_libs/zod_env';
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag, revalidateTag } from 'next/cache';  
import { type ServerResponse } from '@/app/_libs/types';
import ldap_client from "@/app/_libs/ldap";

const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);

async function getUserTotalPagePG(QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readUser", "readUserTotalPage");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT user_uid, username, role, user_created_dt, user_updated_dt
        FROM "jiajunleeWeb"."user"
        WHERE (CAST(user_uid AS TEXT) LIKE $1 OR username LIKE $1);`,
        [QUERY]
    );
    await pool.end();

    return result;
};

async function getUserTotalPageMSSQL(QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readUser", "readUserTotalPage");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('query', sql.VarChar, QUERY)
        .query`SELECT user_uid, username, role, user_created_dt, user_updated_dt
                FROM [jiajunleeWeb].[user]
                WHERE (user_uid like @query OR username like @query);
    `;
    await pool.close();

    return result;
};

export async function readUserTotalPageService(itemsPerPage: number | unknown, query?: string | unknown): Promise<ServerResponse<number>> {

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedQuery = querySchema.parse(query);

    const session = await getServerSession(options);

    if (!session || session.user.role !== 'boss') {
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
            const result = await getUserTotalPagePG(QUERY);
            parsedForm = readUserWithoutPassSchema.array().safeParse(result.rows);
        } 
        
        else {
            const result = await getUserTotalPageMSSQL(QUERY);
            parsedForm = readUserWithoutPassSchema.array().safeParse(result.recordset);
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
        message: "Successfully read user total page.",
        data: totalPage,
    }
};

async function getUserByPagePG(QUERY: string, OFFSET: number, parsedItemsPerPage: number) {
    "use cache"
    cacheLife("max");
    cacheTag("readUser", "readUserByPage");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT u1.user_uid, u1.username, u1.role, u1.user_created_dt, u1.user_updated_dt, COALESCE(u.username, 'system') AS user_updated_by
        FROM "jiajunleeWeb"."user" u1
        LEFT JOIN "jiajunleeWeb"."user" u ON u1.user_updated_by = u.user_uid
        WHERE (CAST(u1.user_uid AS TEXT) LIKE $1 OR u1.username LIKE $1)
        ORDER BY u1.username ASC
        OFFSET $2 LIMIT $3;`,
        [QUERY, OFFSET, parsedItemsPerPage]
    );
    await pool.end();

    return result;
};

async function getUserByPageMSSQL(QUERY: string, OFFSET: number, parsedItemsPerPage: number) {
    "use cache"
    cacheLife("max");
    cacheTag("readUser", "readUserByPage");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
    .input('offset', sql.Int, OFFSET)
    .input('limit', sql.Int, parsedItemsPerPage)
    .input('query', sql.VarChar, QUERY)
    .query`SELECT u1.user_uid, u1.username, u1.role, u1.user_created_dt, u1.user_updated_dt, COALESCE(u.username, 'system') as user_updated_by
            FROM [jiajunleeWeb].[user] u1
            left join [jiajunleeWeb].[user] u ON u1.user_updated_by = u.user_uid
            WHERE (u1.user_uid like @query OR u1.username like @query)
            ORDER BY u1.username asc
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY;
    `;
    await pool.close();

    return result;
};

export async function readUserByPageService(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown): Promise<ServerResponse<TReadUserSchema[]>> {

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedCurrentPage = currentPageSchema.parse(currentPage);
    const parsedQuery = querySchema.parse(query);

    const OFFSET = (parsedCurrentPage - 1) * parsedItemsPerPage;
    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';

    const session = await getServerSession(options);

    if (!session || session.user.role !== 'boss') {
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
            const result = await getUserByPagePG(QUERY, OFFSET, parsedItemsPerPage);
            parsedForm = readUserWithoutPassSchema.array().safeParse(result.rows);    
        } 

        else {
            const result = await getUserByPageMSSQL(QUERY, OFFSET, parsedItemsPerPage);
            parsedForm = readUserWithoutPassSchema.array().safeParse(result.recordset);
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
        message: "Successfully read user by page.",
        data: parsedForm.data,
    }
};

async function getUserTotalPageAdminPG(QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readUser", "readUserTotalPageAdmin");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT user_uid, username, role, user_created_dt, user_updated_dt
        FROM "jiajunleeWeb"."user"
        WHERE role != 'boss' AND (CAST(user_uid AS TEXT) LIKE $1 OR username LIKE $1);`,
        [QUERY]
    );
    await pool.end();

    return result;
};

async function getUserTotalPageAdminMSSQL(QUERY: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readUser", "readUserTotalPageAdmin");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('query', sql.VarChar, QUERY)
        .query`SELECT user_uid, username, role, user_created_dt, user_updated_dt
                FROM [jiajunleeWeb].[user]
                WHERE role != 'boss' AND (user_uid like @query OR username like @query);
    `;
    await pool.close();

    return result;
};

export async function readUserTotalPageAdminService(itemsPerPage: number | unknown, query?: string | unknown): Promise<ServerResponse<number>> {

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedQuery = querySchema.parse(query);

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

    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';
    let parsedForm;
    let totalPage;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const result = await getUserTotalPageAdminPG(QUERY);
            parsedForm = readUserWithoutPassAdminSchema.array().safeParse(result.rows);
        }

        else {
            const result = await getUserTotalPageAdminMSSQL(QUERY);
            parsedForm = readUserWithoutPassAdminSchema.array().safeParse(result.recordset);
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
        message: "Successfully read user total page.",
        data: totalPage,
    }
};

async function getUserByPageAdminPG(QUERY: string, OFFSET: number, parsedItemsPerPage: number) {
    "use cache"
    cacheLife("max");
    cacheTag("readUser", "readUserByPageAdmin");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT u1.user_uid, u1.username, u1.role, COALESCE(u.username, 'system') AS user_updated_by
        FROM "jiajunleeWeb"."user" u1
        LEFT JOIN "jiajunleeWeb"."user" u ON u1.user_updated_by = u.user_uid
        WHERE u1.role != 'boss' AND (CAST(u1.user_uid AS TEXT) LIKE $1 OR u1.username LIKE $1)
        ORDER BY u1.username ASC
        OFFSET $2 LIMIT $3;`,
        [QUERY, OFFSET, parsedItemsPerPage]
    );
    await pool.end();

    return result;
};

async function getUserByPageAdminMSSQL(QUERY: string, OFFSET: number, parsedItemsPerPage: number) {
    "use cache"
    cacheLife("max");
    cacheTag("readUser", "readUserByPageAdmin");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('offset', sql.Int, OFFSET)
        .input('limit', sql.Int, parsedItemsPerPage)
        .input('query', sql.VarChar, QUERY)
        .query`SELECT u1.user_uid, u1.username, u1.role, COALESCE(u.username, 'system') as user_updated_by
                FROM [jiajunleeWeb].[user] u1
                left join [jiajunleeWeb].[user] u ON u1.user_updated_by = u.user_uid
                WHERE u1.role != 'boss' AND (u1.user_uid like @query OR u1.username like @query)
                ORDER BY u1.username asc
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY;
        `;
    await pool.close();

    return result;
};

export async function readUserByPageAdminService(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown): Promise<ServerResponse<TReadUserSchema[]>> {

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedCurrentPage = currentPageSchema.parse(currentPage);
    const parsedQuery = querySchema.parse(query);

    const OFFSET = (parsedCurrentPage - 1) * parsedItemsPerPage;
    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';

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

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const result = await getUserByPageAdminPG(QUERY, OFFSET, parsedItemsPerPage);
            parsedForm = readUserWithoutPassAdminSchema.array().safeParse(result.rows);
        }

        else {
            const result = await getUserByPageAdminMSSQL(QUERY, OFFSET, parsedItemsPerPage);
            parsedForm = readUserWithoutPassAdminSchema.array().safeParse(result.recordset);
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
        message: "Successfully read user by page.",
        data: parsedForm.data,
    }
};

async function getUserByIdPG(user_uid: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readUser", "readUserById");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT u1.user_uid, u1.username, u1.role, u1.user_created_dt, u1.user_updated_dt,
                COALESCE(u.username, 'system') AS user_updated_by
        FROM "jiajunleeWeb"."user" u1
        LEFT JOIN "jiajunleeWeb"."user" u ON u1.user_updated_by = u.user_uid
        WHERE u1.user_uid = $1;`,
        [user_uid]
    );
    await pool.end();

    return result;
};

async function getUserByIdMSSQL(user_uid: string) {
    "use cache"
    cacheLife("max");
    cacheTag("readUser", "readUserById");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.request()
        .input('user_uid', sql.UniqueIdentifier, user_uid)
        .query`SELECT u1.user_uid, u1.username, u1.role, u1.user_created_dt, u1.user_updated_dt, COALESCE(u.username, 'system') as user_updated_by
                FROM [jiajunleeWeb].[user] u1
                left join [jiajunleeWeb].[user] u ON u1.user_updated_by = u.user_uid
                WHERE u1.user_uid = @user_uid;
    `;
    await pool.close();

    return result;
};

export async function readUserByIdService(user_uid: string | unknown): Promise<ServerResponse<TReadUserSchema>> {

    const parsedInput = deleteUserSchema.safeParse({
        user_uid: user_uid,
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

    if (!session || (session.user.role !== 'boss' && session.user.user_uid !== parsedInput.data.user_uid )) {
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
            const result = await getUserByIdPG(parsedInput.data.user_uid);
            parsedForm = readUserWithoutPassSchema.safeParse(result.rows[0]);
        }
        
        else {
            const result = await getUserByIdMSSQL(parsedInput.data.user_uid);
            parsedForm = readUserWithoutPassSchema.safeParse(result.recordset[0]);
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
        message: `Successfully read user ${parsedForm.data.user_uid}.`,
        data: parsedForm.data,
    }
};

export async function signInService(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown): Promise<ServerResponse<TReadUserWithTokenSchema>> {

    const parsedForm = signInSchema.safeParse({
        username: username,
        password: password,
    });

    if (!parsedForm.success) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
            error: parsedForm.error.flatten().fieldErrors,
        }
    };

    if (await rateLimitByIP(5, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    let parsedResult;
    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `SELECT user_uid, username, password, role
                            FROM "jiajunleeWeb"."user"
                            WHERE username = $1;`,
                            [username]
            );
            parsedResult = readUserSchema.safeParse(result.rows[0]);
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('username', sql.VarChar, parsedForm.data.username)
                            .query`SELECT user_uid, username, password, role
                                    FROM [jiajunleeWeb].[user]
                                    WHERE username = @username;
                            `;
            await pool.close();
            parsedResult = readUserSchema.safeParse(result.recordset[0]);
        }
    
        if (!parsedResult.success) {
            return { 
                success: false,
                message: parsedResult.error.message,
                reason: "Invalid Input",
                error: parsedResult.error.flatten().fieldErrors,
            };
        };

        if (parsedResult.data.password && (await bcrypt.compare(parsedForm.data.password, parsedResult.data.password))) {
            const {password, ...userWithoutPassword} = parsedResult.data;
            const jwtToken = signJwtToken(userWithoutPassword);
            const userWithToken = {
                ...userWithoutPassword,
                jwtToken,
            };
            return {
                success: true,
                message: `Successfully sign in with user ${userWithToken.user_uid}`,
                data: userWithToken,
            }
        }
        else {
            return { 
                success: false,
                message: "Invalid user provided.",
                reason: "Invalid Input",
            };
        }
    } 
    catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }
};

export async function signInLDAPService(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown): Promise<ServerResponse<TReadUserWithTokenSchema>> {

    const now = new Date();

    const parsedForm = signInSchema.safeParse({
        username: username,
        password: password,
    });

    if (!parsedForm.success) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
            error: parsedForm.error.flatten().fieldErrors,
        }
    };

    if (await rateLimitByIP(5, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    try {
        
        const dn = `uid=${parsedForm.data.username},${parsedEnv.LDAP_BASE_DN}`;
        await ldap_client.bind(dn, parsedForm.data.password);
        await ldap_client.unbind();

        const signUpResponse = await signUpService(parsedForm.data.username, parsedForm.data.password);
        if (!(signUpResponse.success)) {
            await updateUserLDAPService(parsedForm.data.username, parsedForm.data.password);
        }

        return await signInService(parsedForm.data.username, parsedForm.data.password);

    } catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }
};

export async function updateUserLDAPService(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown): Promise<ServerResponse<undefined>> {

    const now = new Date();

    const parsedForm = updateUserSchema.safeParse({
        user_uid: (typeof username == 'string') ? uuidv5(username, UUID5_SECRET) : undefined,
        password: password,
        user_updated_dt: now,
    });

    if (!parsedForm.success) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
            error: parsedForm.error.flatten().fieldErrors,
        }
    };

    if (await rateLimitByIP(5, 1000*60)) {
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
                            `UPDATE "jiajunleeWeb"."user"
                            SET password = $1, user_updated_dt = $2
                            WHERE user_uid = $3;`,
                            [await bcrypt.hash(parsedForm.data.password, 10), parsedForm.data.user_updated_dt, parsedForm.data.user_uid]
            );
            await pool.end();
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.UniqueIdentifier, parsedForm.data.user_uid)
                            .input('password', sql.VarChar, await bcrypt.hash(parsedForm.data.password, 10))
                            .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                            .query`UPDATE [jiajunleeWeb].[user] 
                                    SET password = @password, user_updated_dt = @user_updated_dt
                                    WHERE user_uid = @user_uid;
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

    revalidateTag("readUser");

    return { 
        success: true,
        message: `Successfully updated user ${parsedForm.data.user_uid}`,
        data: undefined,
    }
};

export async function signInAzureADService(username: TUsernameSchema | unknown): Promise<ServerResponse<TReadUserSchema>> {

    const now = new Date();

    const parsedForm = signInWithoutPassSchema.safeParse({
        username: username,
    });

    if (!parsedForm.success) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
            error: parsedForm.error.flatten().fieldErrors,
        }
    };

    if (await rateLimitByIP(5, 1000*60)) {
        return {
            success: false,
            message: "Too many requests, try again later.",
            reason: "Too Many Requests",
        }
    }

    try {
        let parsedResult;
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `INSERT INTO "jiajunleeWeb"."user" (user_uid, username, password, role, user_created_dt, user_updated_dt)
                            VALUES ($1, $2, $3, $4, $5, $6)
                            ON CONFLICT (username) DO UPDATE
                            SET user_updated_dt = EXCLUDED.user_updated_dt
                            RETURNING user_uid, username, role;`,
                            [uuidv5(parsedForm.data.username, UUID5_SECRET), parsedForm.data.username, await bcrypt.hash(uuidv5(parsedForm.data.username, UUID5_SECRET), 10), 'user', now, now]
            );
            await pool.end();
            parsedResult = readUserSchema.safeParse(result.rows[0]);
        }
        
        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.UniqueIdentifier, uuidv5(parsedForm.data.username, UUID5_SECRET))
                            .input('username', sql.VarChar, parsedForm.data.username)
                            .input('password', sql.VarChar, await bcrypt.hash(uuidv5(parsedForm.data.username, UUID5_SECRET), 10))
                            .input('role', sql.VarChar, 'user')
                            .input('user_created_dt', sql.DateTime, now)
                            .input('user_updated_dt', sql.DateTime, now)
                            .query`MERGE [jiajunleeWeb].[user] AS target
                                    USING (VALUES (@user_uid, @username, @password, @role, @user_created_dt, @user_updated_dt))
                                        AS source (user_uid, username, password, role, user_created_dt, user_updated_dt)
                                    ON target.username = source.username
                                    WHEN NOT MATCHED THEN
                                        INSERT (user_uid, username, password, role, user_created_dt, user_updated_dt)
                                        VALUES (source.user_uid, source.username, source.password, source.role, source.user_created_dt, source.user_updated_dt)
                                    WHEN MATCHED THEN
                                        UPDATE SET target.user_updated_dt = source.user_updated_dt
                                    OUTPUT inserted.user_uid, inserted.username, inserted.role;`;
            await pool.close();
            parsedResult = readUserSchema.safeParse(result.recordset[0]);
        }

        if (!parsedResult.success) {
            return {
                success: false,
                message: parsedResult.error.message,
                reason: "Invalid Output",
                error: parsedResult.error.flatten().fieldErrors,
            }
        };

        return {
            success: true,
            message: `Successfully sign in with user ${parsedResult.data.user_uid}`,
            data: parsedResult.data,
        }
    } 
    catch (err) {
        return {
            success: false,
            message: getErrorMessage(err),
            reason: "Unexpected Error",
        }
    }

};

export async function signUpService(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown): Promise<ServerResponse<undefined>> {

    const now = new Date();

    const parsedForm = signUpSchema.safeParse({
        user_uid: (typeof username == 'string') ? uuidv5(username, UUID5_SECRET) : undefined,
        username: username,
        password: password,
        role: 'user',
        user_created_dt: now,
        user_updated_dt: now,
    });

    if (!parsedForm.success) {
        return {
            success: false,
            message: parsedForm.error.message,
            reason: "Invalid Input",
            error: parsedForm.error.flatten().fieldErrors,
        }  
    };

    if (await rateLimitByIP(5, 1000*60)) {
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
                            `INSERT INTO "jiajunleeWeb"."user"
                            (user_uid, username, password, role, user_created_dt, user_updated_dt)
                            VALUES ($1, $2, $3, $4, $5, $6);`,
                            [parsedForm.data.user_uid, parsedForm.data.username, await bcrypt.hash(parsedForm.data.password, 10), parsedForm.data.role, parsedForm.data.user_created_dt, parsedForm.data.user_updated_dt]
            );
            await pool.end();
        }

        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.UniqueIdentifier, parsedForm.data.user_uid)
                            .input('username', sql.VarChar, parsedForm.data.username)
                            .input('password', sql.VarChar, await bcrypt.hash(parsedForm.data.password, 10))
                            .input('role', sql.VarChar, parsedForm.data.role)
                            .input('user_created_dt', sql.DateTime, parsedForm.data.user_created_dt)
                            .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                            .query`INSERT INTO [jiajunleeWeb].[user] 
                                    (user_uid, username, password, role, user_created_dt, user_updated_dt)
                                    VALUES (@user_uid, @username, @password, @role, @user_created_dt, @user_updated_dt);
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

    revalidateTag("readUser");

    return { 
        success: true,
        message: `Successfully created user ${parsedForm.data.user_uid}`,
        data: undefined,
    }
};

export async function updateUserService(formData: FormData | unknown): Promise<ServerResponse<undefined>> {

    if (!(formData instanceof FormData)) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
        }  
    };

    const now = new Date();

    const parsedForm = updateUserSchema.safeParse({
        user_uid: formData.get("user_uid"),
        password: formData.get("password"),
        user_updated_dt: now,
    });

    if (!parsedForm.success) {
        return {
            success: false,
            message: parsedForm.error.message,
            reason: "Invalid Input",
            error: parsedForm.error.flatten().fieldErrors,
        }  
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.user_uid !== parsedForm.data.user_uid )) {
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

    try {

        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `UPDATE "jiajunleeWeb"."user"
                            SET password = $1, user_updated_dt = $2, user_updated_by = $3
                            WHERE user_uid = $4;`,
                            [await bcrypt.hash(parsedForm.data.password, 10), parsedForm.data.user_updated_dt, session.user.user_uid, parsedForm.data.user_uid]
            );
            await pool.end();
        }      

        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.UniqueIdentifier, parsedForm.data.user_uid)
                            .input('password', sql.VarChar, await bcrypt.hash(parsedForm.data.password, 10))
                            .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                            .input('user_updated_by', sql.VarChar, session.user.user_uid)
                            .query`UPDATE [jiajunleeWeb].[user] 
                                    SET password = @password, user_updated_dt = @user_updated_dt, user_updated_by = @user_updated_by
                                    WHERE user_uid = @user_uid;
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

    revalidateTag("readUser");

    return { 
        success: true,
        message: `Successfully updated user ${parsedForm.data.user_uid}`,
        data: undefined,
    }
};

export async function deleteUserService(user_uid: string | unknown): Promise<ServerResponse<undefined>> {

    const parsedForm = deleteUserSchema.safeParse({
        user_uid: user_uid,
    });

    if (!parsedForm.success) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
        }  
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.user_uid !== parsedForm.data.user_uid )) {
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

    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `DELETE FROM "jiajunleeWeb"."user"
                            WHERE user_uid = $1;`,
                            [parsedForm.data.user_uid]
            );
            await pool.end();
        }

        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.UniqueIdentifier, parsedForm.data.user_uid)
                            .query`DELETE FROM [jiajunleeWeb].[user] 
                                    WHERE user_uid = @user_uid;
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

    revalidateTag("readUser");

    return { 
        success: true,
        message: `Successfully deleted user ${parsedForm.data.user_uid}`,
        data: undefined,
    }
};

export async function updateRoleService(formData: FormData | unknown): Promise<ServerResponse<undefined>> {

    if (!(formData instanceof FormData)) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
        }
    };

    const now = new Date();

    const parsedForm = updateRoleSchema.safeParse({
        user_uid: formData.get("user_uid"),
        role: formData.get("role"),
        user_updated_dt: now,
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

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss')) {
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

    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `UPDATE "jiajunleeWeb"."user"
                            SET role = $1, user_updated_dt = $2, user_updated_by = $3
                            WHERE user_uid = $4;`,
                            [parsedForm.data.role, parsedForm.data.user_updated_dt, session.user.user_uid, parsedForm.data.user_uid]
            );
            await pool.end();
        }

        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.UniqueIdentifier, parsedForm.data.user_uid)
                            .input('role', sql.VarChar, parsedForm.data.role)
                            .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                            .input('user_updated_by', sql.VarChar, session.user.user_uid)
                            .query`UPDATE [jiajunleeWeb].[user] 
                                    SET role = @role, user_updated_dt = @user_updated_dt, user_updated_by = @user_updated_by
                                    WHERE user_uid = @user_uid;
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

    revalidateTag("readUser");

    return { 
        success: true,
        message: `Successfully updated role for user ${parsedForm.data.user_uid}`,
        data: undefined,
    }
};

export async function updateRoleAdminService(formData: FormData | unknown): Promise<ServerResponse<undefined>> {

    if (!(formData instanceof FormData)) {
        return {
            success: false,
            message: "Invalid input provided.",
            reason: "Invalid Input",
        }
    };

    const now = new Date();

    const parsedForm = updateRoleAdminSchema.safeParse({
        user_uid: formData.get("user_uid"),
        role: formData.get("role"),
        user_updated_dt: now,
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

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin' )) {
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

    try {
        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                            `UPDATE "jiajunleeWeb"."user"
                            SET role = $1, user_updated_dt = $2, user_updated_by = $3
                            WHERE user_uid = $4 AND role <> 'boss';`,
                            [parsedForm.data.role, parsedForm.data.user_updated_dt, session.user.user_uid, parsedForm.data.user_uid]
            );
            await pool.end();
        }

        else {
            let pool = await sql.connect(msSqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.UniqueIdentifier, parsedForm.data.user_uid)
                            .input('role', sql.VarChar, parsedForm.data.role)
                            .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                            .input('user_updated_by', sql.VarChar, session.user.user_uid)
                            .query`UPDATE [jiajunleeWeb].[user] 
                                    SET role = @role, user_updated_dt = @user_updated_dt, user_updated_by = @user_updated_by
                                    WHERE user_uid = @user_uid and role <> 'boss';
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

    revalidateTag("readUser");

    return { 
        success: true,
        message: `Successfully updated role for user ${parsedForm.data.user_uid}`,
        data: undefined, 
    }
};