'use server'

import { rateLimitByIP, rateLimitByUid } from "@/app/_libs/rate_limit";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { redirect } from "next/navigation";
import { v5 as uuidv5 } from 'uuid';
import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { sqlConfig } from "@/app/_libs/sql_config";
import { type TUsernameSchema, type TPasswordSchema, usernameSchema, signInSchema, signUpSchema, readUserSchema, readUserWithoutPassSchema, updateUserSchema, deleteUserSchema, updateRoleSchema, updateRoleAdminSchema, readUserWithoutPassAdminSchema } from "@/app/_libs/zod_auth";
import { itemsPerPageSchema, currentPageSchema, querySchema } from '@/app/_libs/zod_server';
import { getErrorMessage } from '@/app/_libs/error_handler';
import { signJwtToken } from '@/app/_libs/jwt';
import { parsedEnv } from '@/app/_libs/zod_env';
import { unstable_noStore as noStore } from 'next/cache';
import { type StatePromise } from '@/app/_libs/types';
import ldap_client from "@/app/_libs/ldap";

const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);

export async function readUserByUsername(username: TUsernameSchema | unknown) {
    noStore();

    const parsedForm = usernameSchema.safeParse(username);

    if (!parsedForm.success) {
        throw new Error(parsedForm.error.message)
    };

    const session = await getServerSession(options);

    if (!session || session.user.role !== 'boss') {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedResult;
    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('username', sql.VarChar, parsedForm.data)
                        .query`SELECT user_uid, username, role
                                FROM [jiajunleeWeb].[user]
                                WHERE username = @username;
                        `;
        parsedResult = readUserWithoutPassSchema.safeParse(result.recordset[0]);
    
        if (!parsedResult.success) {
            throw new Error(parsedResult.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    return parsedResult.data
};

export async function readUserByUsernameAdmin(username: TUsernameSchema | unknown) {
    noStore();
    const parsedForm = usernameSchema.safeParse(username);

    if (!parsedForm.success) {
        throw new Error(parsedForm.error.message)
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedResult;
    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('username', sql.VarChar, parsedForm.data)
                        .query`SELECT user_uid, username, role
                                FROM [jiajunleeWeb].[user]
                                WHERE username = @username and role !== 'boss';
                        `;
        parsedResult = readUserWithoutPassAdminSchema.safeParse(result.recordset[0]);
    
        if (!parsedResult.success) {
            throw new Error(parsedResult.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    return parsedResult.data
};

export async function readUserTotalPage(itemsPerPage: number | unknown, query?: string | unknown) {
    noStore();

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedQuery = querySchema.parse(query);

    const session = await getServerSession(options);

    if (!session || session.user.role !== 'boss') {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';
    let parsedForm;
    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('query', sql.VarChar, QUERY)
                        .query`SELECT user_uid, username, role 
                                FROM [jiajunleeWeb].[user]
                                WHERE (user_uid like @query OR username like @query);
                        `;
        parsedForm = readUserWithoutPassSchema.array().safeParse(result.recordset);

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

export async function readUserByPage(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown) {
    noStore();

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedCurrentPage = currentPageSchema.parse(currentPage);
    const parsedQuery = querySchema.parse(query);

    const OFFSET = (parsedCurrentPage - 1) * parsedItemsPerPage;
    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';

    const session = await getServerSession(options);

    if (!session || session.user.role !== 'boss') {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('offset', sql.Int, OFFSET)
                        .input('limit', sql.Int, parsedItemsPerPage)
                        .input('query', sql.VarChar, QUERY)
                        .query`SELECT user_uid, username, role 
                                FROM [jiajunleeWeb].[user]
                                WHERE (user_uid like @query OR username like @query)
                                ORDER BY username asc
                                OFFSET @offset ROWS
                                FETCH NEXT @limit ROWS ONLY;
                        `;
        parsedForm = readUserWithoutPassSchema.array().safeParse(result.recordset);

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    return parsedForm.data
};

export async function readUserTotalPageAdmin(itemsPerPage: number | unknown, query?: string | unknown) {
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
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('query', sql.VarChar, QUERY)
                        .query`SELECT user_uid, username, role 
                                FROM [jiajunleeWeb].[user]
                                WHERE role != 'boss' AND (user_uid like @query OR username like @query);
                        `;
        parsedForm = readUserWithoutPassAdminSchema.array().safeParse(result.recordset);

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

export async function readUserByPageAdmin(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown) {
    noStore();

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedCurrentPage = currentPageSchema.parse(currentPage);
    const parsedQuery = querySchema.parse(query);

    const OFFSET = (parsedCurrentPage - 1) * parsedItemsPerPage;
    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('offset', sql.Int, OFFSET)
                        .input('limit', sql.Int, parsedItemsPerPage)
                        .input('query', sql.VarChar, QUERY)
                        .query`SELECT user_uid, username, role 
                                FROM [jiajunleeWeb].[user]
                                WHERE role != 'boss' AND (user_uid like @query OR username like @query)
                                ORDER BY username asc
                                OFFSET @offset ROWS
                                FETCH NEXT @limit ROWS ONLY;
                        `;
        parsedForm = readUserWithoutPassAdminSchema.array().safeParse(result.recordset);

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    return parsedForm.data
};

export async function readAdminTotalPage(itemsPerPage: number | unknown, query?: string | unknown) {
    noStore();

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedQuery = querySchema.parse(query);

    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';

    const session = await getServerSession(options);

    if (!session) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('role', sql.VarChar, 'admin')
                        .input('query', sql.VarChar, QUERY)
                        .query`SELECT user_uid, username, role 
                                FROM [jiajunleeWeb].[user]
                                WHERE role = @role
                                AND (username like @query);
                        `;
        parsedForm = readUserWithoutPassSchema.array().safeParse(result.recordset);

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

export async function readAdminByPage(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown) {
    noStore();

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedCurrentPage = currentPageSchema.parse(currentPage);
    const parsedQuery = querySchema.parse(query);

    const OFFSET = (parsedCurrentPage - 1) * parsedItemsPerPage;
    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';

    const session = await getServerSession(options);

    if (!session) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('role', sql.VarChar, 'admin')
                        .input('offset', sql.Int, OFFSET)
                        .input('limit', sql.Int, parsedItemsPerPage)
                        .input('query', sql.VarChar, QUERY)
                        .query`SELECT user_uid, username, role 
                                FROM [jiajunleeWeb].[user]
                                WHERE role = @role
                                AND (username like @query)
                                ORDER BY username asc
                                OFFSET @offset ROWS
                                FETCH NEXT @limit ROWS ONLY;
                        `;
        parsedForm = readUserWithoutPassSchema.array().safeParse(result.recordset);

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    return parsedForm.data
};

export async function signIn(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown) {

    const parsedForm = signInSchema.safeParse({
        username: username,
        password: password,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to sign in!"
        };
    };

    if (await rateLimitByIP(5, 1000*60)) {
        return { 
            error: {error: ["Too many requests, try again later."]},
            message: "Too many requests, try again later."
        };
    }

    let parsedResult;
    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('username', sql.VarChar, parsedForm.data.username)
                        .query`SELECT user_uid, username, password, role
                                FROM [jiajunleeWeb].[user]
                                WHERE username = @username;
                        `;
        parsedResult = readUserSchema.safeParse(result.recordset[0]);
    
        if (!parsedResult.success) {
            return { 
                error: parsedResult.error.flatten().fieldErrors,
                message: "Invalid user provided, failed to sign in!"
            };
        };

        if (parsedResult.data.password && (await bcrypt.compare(parsedForm.data.password, parsedResult.data.password))) {
            const {password, ...userWithoutPassword} = parsedResult.data;
            const jwtToken = signJwtToken(userWithoutPassword);
            const userWithToken = {
                ...userWithoutPassword,
                jwtToken,
            };
            return userWithToken
        }
        else {
            return { 
                error: {error: "Invalid user provided, failed to sign in!"},
                message: "Invalid user provided, failed to sign in!"
            };
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: "Invalid user provided, failed to sign in!"
        };
    }

};

export async function signInLDAP(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown) {

    const now = new Date();

    const parsedForm = signInSchema.safeParse({
        username: username,
        password: password,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to sign in!"
        };
    };

    if (await rateLimitByIP(5, 1000*60)) {
        return { 
            error: {error: ["Too many requests, try again later."]},
            message: "Too many requests, try again later."
        };
    }

    try {
        
        const dn = `uid=${parsedForm.data.username},${parsedEnv.LDAP_BASE_DN}`;
        await ldap_client.bind(dn, parsedForm.data.password);

        const signUpResult = await signUp(parsedForm.data.username, parsedForm.data.password);
        if (signUpResult.error) {
            await updateUserLDAP(parsedForm.data.username, parsedForm.data.password);
        }

        await ldap_client.unbind();
        return await signIn(parsedForm.data.username, parsedForm.data.password);

    } catch (error) {
        await ldap_client.unbind();
        return {
            error: {error: ["Invalid user provided, failed to sign in!"]},
            message: "Invalid user provided, failed to sign in!"
        }
    }
};

export async function updateUserLDAP(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown) {

    const now = new Date();

    const parsedForm = updateUserSchema.safeParse({
        user_uid: (typeof username == 'string') ? uuidv5(username, UUID5_SECRET) : undefined,
        password: password,
        user_updated_dt: now,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to sign in!"
        };
    };

    if (await rateLimitByIP(5, 1000*60)) {
        return { 
            error: {error: ["Too many requests, try again later."]},
            message: "Too many requests, try again later."
        };
    }

    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                        .input('password', sql.VarChar, await bcrypt.hash(parsedForm.data.password, 10),)
                        .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                        .query`UPDATE [jiajunleeWeb].[user] 
                                SET password = @password, user_updated_dt = @user_updated_dt
                                WHERE user_uid = @user_uid;
                        `;
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: "Invalid user provided, failed to update user!"
        };
    }

    return { message: `Successfully updated user ${parsedForm.data.user_uid}` }
};

export async function signUp(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown): StatePromise {

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
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to sign up!"
        };
    };

    if (await rateLimitByIP(5, 1000*60)) {
        return { 
            error: {error: ["Too many requests, try again later."]},
            message: "Too many requests, try again later."
        };
    }

    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                        .input('username', sql.VarChar, parsedForm.data.username)
                        .input('password', sql.VarChar, await bcrypt.hash(parsedForm.data.password, 10),)
                        .input('role', sql.VarChar, parsedForm.data.role)
                        .input('user_created_dt', sql.DateTime, parsedForm.data.user_created_dt)
                        .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                        .query`INSERT INTO [jiajunleeWeb].[user] 
                                (user_uid, username, password, role, user_created_dt, user_updated_dt)
                                VALUES (@user_uid, @username, @password, @role, @user_created_dt, @user_updated_dt);
                        `;
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: "Invalid user provided, failed to sign up!"
        };
    }

    return { message: `Successfully created user ${parsedForm.data.user_uid}` }
};

export async function updateUser(formData: FormData | unknown): StatePromise {

    if (!(formData instanceof FormData)) {
        return { 
            error: {error: ["Invalid input provided !"]},
            message: "Invalid input provided !"
        };  
    };

    const now = new Date();

    const parsedForm = updateUserSchema.safeParse({
        user_uid: formData.get("user_uid"),
        password: formData.get("password"),
        user_updated_dt: now,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to update user!"
        };
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.user_uid !== parsedForm.data.user_uid )) {
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
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                        .input('password', sql.VarChar, await bcrypt.hash(parsedForm.data.password, 10),)
                        .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                        .query`UPDATE [jiajunleeWeb].[user] 
                                SET password = @password, user_updated_dt = @user_updated_dt
                                WHERE user_uid = @user_uid;
                        `;
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: "Invalid user provided, failed to update user!"
        };
    }

    return { message: `Successfully updated user ${parsedForm.data.user_uid}` }
};

export async function deleteUser(user_uid: string | unknown): StatePromise {

    const now = new Date();

    const parsedForm = deleteUserSchema.safeParse({
        user_uid: user_uid,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to delete user!"
        };    
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.user_uid !== parsedForm.data.user_uid )) {
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
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                        .query`DELETE FROM [jiajunleeWeb].[user] 
                                WHERE user_uid = @user_uid;
                        `;
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: "Invalid user provided, failed to delete user!"
        };
    }

    return { message: `Successfully deleted user ${parsedForm.data.user_uid}` }
};

export async function readUserById(user_uid: string | unknown) {
    noStore();
    
    const parsedInput = deleteUserSchema.safeParse({
        user_uid: user_uid,
    });

    if (!parsedInput.success) {
        throw new Error(parsedInput.error.message)
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.user_uid !== parsedInput.data.user_uid )) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

    let parsedForm;
    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('user_uid', sql.VarChar, parsedInput.data.user_uid)
                        .query`SELECT user_uid, username, role, user_created_dt, user_updated_dt 
                                FROM [jiajunleeWeb].[user]
                                WHERE user_uid = @user_uid;
                        `;
        parsedForm = readUserWithoutPassSchema.safeParse(result.recordset[0]);

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };

    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    return parsedForm.data
};

export async function updateRole(formData: FormData | unknown): StatePromise {

    if (!(formData instanceof FormData)) {
        return { 
            error: {error: ["Invalid input provided !"]},
            message: "Invalid input provided !"
        };  
    };

    const now = new Date();

    const parsedForm = updateRoleSchema.safeParse({
        user_uid: formData.get("user_uid"),
        role: formData.get("role"),
        user_updated_dt: now,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to update role!"
        };  
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss')) {
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
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                        .input('role', sql.VarChar, parsedForm.data.role)
                        .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                        .query`UPDATE [jiajunleeWeb].[user] 
                                SET role = @role, user_updated_dt = @user_updated_dt
                                WHERE user_uid = @user_uid;
                        `;
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: "Invalid user provided, failed to update role!"
        };
    }

    return { message: `Successfully updated role for user ${parsedForm.data.user_uid}` }
};

export async function updateRoleAdmin(formData: FormData | unknown): StatePromise {

    if (!(formData instanceof FormData)) {
        return { 
            error: {error: ["Invalid input provided !"]},
            message: "Invalid input provided !"
        };  
    };

    const now = new Date();

    const parsedForm = updateRoleAdminSchema.safeParse({
        user_uid: formData.get("user_uid"),
        role: formData.get("role"),
        user_updated_dt: now,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to update role!"
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
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request()
                        .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                        .input('role', sql.VarChar, parsedForm.data.role)
                        .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                        .query`UPDATE [jiajunleeWeb].[user] 
                                SET role = @role, user_updated_dt = @user_updated_dt
                                WHERE user_uid = @user_uid and role !== 'boss';
                        `;
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: "Invalid user provided, failed to update role!"
        };
    }

    return { message: `Successfully updated role for user ${parsedForm.data.user_uid}` }
};