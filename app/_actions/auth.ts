'use server'

import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { redirect } from "next/navigation";
import { v5 as uuidv5 } from 'uuid';
import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { sqlConfig } from "@/app/_libs/sql_config";
import { type TEmailSchema, type TPasswordSchema, emailSchema, signInSchema, signUpSchema, readUserSchema, readUserWithoutPassSchema, updateUserSchema, deleteUserSchema, updateRoleSchema, updateRoleAdminSchema, readUserWithoutPassAdminSchema } from "@/app/_libs/zod_auth";
import { uuidSchema, itemsPerPageSchema, currentPageSchema, querySchema } from '@/app/_libs/zod_server';
import { getErrorMessage } from '@/app/_libs/error_handler';
import { revalidatePath } from 'next/cache';
import { signJwtToken } from '@/app/_libs/jwt';
import { parsedEnv } from '@/app/_libs/zod_env';
import prisma from '@/prisma/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { type StatePromise } from '@/app/_libs/types';
import { flattenNestedObject } from '@/app/_libs/nested_object';

const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);

export async function readUserByEmail(email: TEmailSchema | unknown) {
    noStore();

    const session = await getServerSession(options);

    if (!session || session.user.role !== 'boss') {
        redirect("/denied");
    }

    const parsedForm = emailSchema.safeParse(email);

    if (!parsedForm.success) {
        throw new Error(parsedForm.error.message)
    };

    let parsedResult;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.user.findFirst({
                where: {
                    email: parsedForm.data,
                },
                select: {
                    user_uid: true,
                    email: true,
                    role: true,
                },
            })
            const flattenResult = flattenNestedObject(result);
            parsedResult = readUserWithoutPassSchema.safeParse(flattenResult);
        }

        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('email', sql.VarChar, parsedForm.data)
                            .query`SELECT user_uid, email, role
                                    FROM "packing"."user"
                                    WHERE email = @email;
                            `;
            parsedResult = readUserWithoutPassSchema.safeParse(result.recordset[0]);
        }
    
        if (!parsedResult.success) {
            throw new Error(parsedResult.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    return parsedResult.data
};

export async function readUserByEmailAdmin(email: TEmailSchema | unknown) {
    noStore();
    const parsedForm = emailSchema.safeParse(email);

    if (!parsedForm.success) {
        throw new Error(parsedForm.error.message)
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role != 'admin')) {
        redirect("/denied");
    }

    let parsedResult;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.user.findFirst({
                where: {
                    email: parsedForm.data,
                    role: {
                        not: 'boss',
                    },
                },
                select: {
                    user_uid: true,
                    email: true,
                    role: true,
                },
            })
            const flattenResult = flattenNestedObject(result);
            parsedResult = readUserWithoutPassAdminSchema.safeParse(flattenResult);
        }

        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('email', sql.VarChar, parsedForm.data)
                            .query`SELECT user_uid, email, role
                                    FROM "packing"."user"
                                    WHERE email = @email and role != 'boss';
                            `;
            parsedResult = readUserWithoutPassAdminSchema.safeParse(result.recordset[0]);
        }
    
        if (!parsedResult.success) {
            throw new Error(parsedResult.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    return parsedResult.data
};

export async function readUserTotalPage(itemsPerPage: number | unknown, query?: string | unknown | undefined) {
    noStore();

    const session = await getServerSession(options);

    if (!session || session.user.role !== 'boss') {
        redirect("/denied");
    }

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedQuery = querySchema.parse(query);

    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.user.findMany({
                select: {
                    user_uid: true,
                    email: true,
                    role: true,
                },
                where: {
                    ...(parsedQuery &&
                        {
                            OR: [
                                ...(['user_uid', 'email'].map((e) => {
                                    return {
                                        [e]: {
                                            search: `${parsedQuery.replace(/[\s\n\t]/g, '_')}:*`,
                                        },
                                    };
                                })),
                            ],
                        }),
                },
            });
            const flattenResult = result.map((row) => {
                return flattenNestedObject(row)
            });
            parsedForm = readUserWithoutPassSchema.array().safeParse(flattenResult);
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('query', sql.VarChar, QUERY)
                            .query`SELECT user_uid, email, role 
                                    FROM "packing"."user"
                                    WHERE (user_uid like @query OR email like @query);
                            `;
            parsedForm = readUserWithoutPassSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }
    const totalPage = Math.ceil(parsedForm.data.length / parsedItemsPerPage);
    // revalidatePath('/restricted/auth/user');
    return totalPage
};

export async function readUserByPage(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown | undefined) {
    noStore();

    // <dev only> 
    // Artifically delay the response, to view the Suspense fallback skeleton
    // console.log("waiting 3sec")
    // await new Promise((resolve) => setTimeout(resolve, 3000));
    // console.log("ok")
    // <dev only>

    const session = await getServerSession(options);

    if (!session || session.user.role !== 'boss') {
        redirect("/denied");
    }

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedCurrentPage = currentPageSchema.parse(currentPage);
    const parsedQuery = querySchema.parse(query);

    const OFFSET = (parsedCurrentPage - 1) * parsedItemsPerPage;
    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';
    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.user.findMany({
                select: {
                    user_uid: true,
                    email: true,
                    role: true,
                },
                where: {
                    ...(parsedQuery &&
                        {
                            OR: [
                                ...(['user_uid', 'email'].map((e) => {
                                    return {
                                        [e]: {
                                            search: `${parsedQuery.replace(/[\s\n\t]/g, '_')}:*`,
                                        },
                                    };
                                })),
                            ],
                        }),
                },
                skip: OFFSET,
                take: parsedItemsPerPage,
            });
            const flattenResult = result.map((row) => {
                return flattenNestedObject(row)
            });
            parsedForm = readUserWithoutPassSchema.array().safeParse(flattenResult);
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('offset', sql.Int, OFFSET)
                            .input('limit', sql.Int, parsedItemsPerPage)
                            .input('query', sql.VarChar, QUERY)
                            .query`SELECT user_uid, email, role 
                                    FROM "packing"."user"
                                    WHERE (user_uid like @query OR email like @query)
                                    ORDER BY email asc
                                    OFFSET @offset ROWS
                                    FETCH NEXT @limit ROWS ONLY;
                            `;
            parsedForm = readUserWithoutPassSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    // revalidatePath('/restricted/auth/user');
    return parsedForm.data
};

export async function readAdminTotalPage(itemsPerPage: number | unknown, query?: string | unknown | undefined) {
    noStore();

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedQuery = querySchema.parse(query);

    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';
    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.user.findMany({
                select: {
                    user_uid: true,
                    email: true,
                    role: true,
                },
                where: {
                    role: "admin",
                    ...(parsedQuery &&
                    {
                        OR: [
                            ...(['email'].map((e) => {
                                return {
                                    [e]: {
                                        search: `${parsedQuery.replace(/[\s\n\t]/g, '_')}:*`,
                                    },
                                };
                            })),
                        ],
                    })
                },
            });
            const flattenResult = result.map((row) => {
                return flattenNestedObject(row)
            });
            parsedForm = readUserWithoutPassSchema.array().safeParse(flattenResult);
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('role', sql.VarChar, 'admin')
                            .input('query', sql.VarChar, QUERY)
                            .query`SELECT user_uid, email, role 
                                    FROM "packing"."user"
                                    WHERE role = @role
                                    AND (email like @query);
                            `;
            parsedForm = readUserWithoutPassSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }
    const totalPage = Math.ceil(parsedForm.data.length / parsedItemsPerPage);
    // revalidatePath('/authenticated/adminList');
    return totalPage
};

export async function readAdminByPage(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown | undefined) {
    noStore();

    // <dev only> 
    // Artifically delay the response, to view the Suspense fallback skeleton
    // console.log("waiting 3sec")
    // await new Promise((resolve) => setTimeout(resolve, 3000));
    // console.log("ok")
    // <dev only>

    const parsedItemsPerPage = itemsPerPageSchema.parse(itemsPerPage);
    const parsedCurrentPage = currentPageSchema.parse(currentPage);
    const parsedQuery = querySchema.parse(query);

    const OFFSET = (parsedCurrentPage - 1) * parsedItemsPerPage;
    const QUERY = parsedQuery ? `${parsedQuery || ''}%` : '%';
    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.user.findMany({
                select: {
                    user_uid: true,
                    email: true,
                    role: true,
                },
                where: {
                    role: "admin",
                    ...(parsedQuery &&
                    {
                        OR: [
                            ...(['email'].map((e) => {
                                return {
                                    [e]: {
                                        search: `${parsedQuery.replace(/[\s\n\t]/g, '_')}:*`,
                                    },
                                };
                            })),
                        ],
                    })
                },
                skip: OFFSET,
                take: parsedItemsPerPage,
            });
            const flattenResult = result.map((row) => {
                return flattenNestedObject(row)
            });
            parsedForm = readUserWithoutPassSchema.array().safeParse(flattenResult);
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('role', sql.VarChar, 'admin')
                            .input('offset', sql.Int, OFFSET)
                            .input('limit', sql.Int, parsedItemsPerPage)
                            .input('query', sql.VarChar, QUERY)
                            .query`SELECT user_uid, email, role 
                                    FROM "packing"."user"
                                    WHERE role = @role
                                    AND (email like @query)
                                    ORDER BY email asc
                                    OFFSET @offset ROWS
                                    FETCH NEXT @limit ROWS ONLY;
                            `;
            parsedForm = readUserWithoutPassSchema.array().safeParse(result.recordset);
        }

        if (!parsedForm.success) {
            throw new Error(parsedForm.error.message)
        };
    } 
    catch (err) {
        throw new Error(getErrorMessage(err))
    }

    // revalidatePath('/authenticated/adminList');
    return parsedForm.data
};

export async function signIn(email: TEmailSchema | unknown, password: TPasswordSchema | unknown) {

    const parsedForm = signInSchema.safeParse({
        email: email,
        password: password,
    });

    if (!parsedForm.success) {
        return { 
            error: parsedForm.error.flatten().fieldErrors,
            message: "Invalid input provided, failed to sign in!"
        };
    };

    let parsedResult;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.user.findFirst({
                where: {
                    email: parsedForm.data.email,
                },
                select: {
                    user_uid: true,
                    email: true,
                    password: true,
                    role: true,
                },
            })
            const flattenResult = flattenNestedObject(result);
            parsedResult = readUserSchema.safeParse(flattenResult);
        }

        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('email', sql.VarChar, parsedForm.data.email)
                            .query`SELECT user_uid, email, password, role
                                    FROM "packing"."user"
                                    WHERE email = @email;
                            `;
            parsedResult = readUserSchema.safeParse(result.recordset[0]);
        }
    
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

export async function signUp(email: TEmailSchema | unknown, password: TPasswordSchema | unknown): StatePromise {

    const now = new Date();

    const parsedForm = signUpSchema.safeParse({
        user_uid: (typeof email == 'string') ? uuidv5(email, UUID5_SECRET) : undefined,
        email: email,
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

    try {
        
        if (parsedEnv.DB_TYPE === "PRISMA") {
            const result = await prisma.user.create({
                data: {...parsedForm.data, password: await bcrypt.hash(parsedForm.data.password, 10)},
            });
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                            .input('email', sql.VarChar, parsedForm.data.email)
                            .input('password', sql.VarChar, await bcrypt.hash(parsedForm.data.password, 10),)
                            .input('role', sql.VarChar, parsedForm.data.role)
                            .input('user_created_dt', sql.DateTime, parsedForm.data.user_created_dt)
                            .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                            .query`INSERT INTO "packing"."user" 
                                    (user_uid, email, password, role, user_created_dt, user_updated_dt)
                                    VALUES (@user_uid, @email, @password, @role, @user_created_dt, @user_updated_dt);
                            `;
        }
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
        throw new Error('Invalid input provided !');
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

    if (!session || (session.user.role !== 'boss' && session.user.user_uid != parsedForm.data.user_uid )) {
        redirect("/denied");
    }

    try {
        
        if (parsedEnv.DB_TYPE === "PRISMA") {
            const result = await prisma.user.update({
                where: {
                    user_uid: parsedForm.data.user_uid,
                },
                data: {...parsedForm.data, password: await bcrypt.hash(parsedForm.data.password, 10)},
            });
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                            .input('password', sql.VarChar, await bcrypt.hash(parsedForm.data.password, 10),)
                            .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                            .query`UPDATE "packing"."user" 
                                    SET password = @password, user_updated_dt = @user_updated_dt
                                    WHERE user_uid = @user_uid;
                            `;
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: "Invalid user provided, failed to sign up!"
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

    if (!session || (session.user.role !== 'boss' && session.user.user_uid != parsedForm.data.user_uid )) {
        redirect("/denied");
    }

    try {
        
        if (parsedEnv.DB_TYPE === "PRISMA") {
            const result = await prisma.user.delete({
                where: {
                    user_uid: parsedForm.data.user_uid,
                },
            });
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                            .query`DELETE FROM "packing"."user" 
                                    WHERE user_uid = @user_uid;
                            `;
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: "Invalid user provided, failed to delete user!"
        };
    }

    // revalidatePath("/restricted/auth/user");
    return { message: `Successfully deleted user ${parsedForm.data.user_uid}` }
};

export async function readUserById(user_uid: string | unknown) {
    noStore();
    
    const parsed_uid = uuidSchema.safeParse(user_uid);

    if (!parsed_uid.success) {
        throw new Error(parsed_uid.error.message)
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.user_uid != parsed_uid.data )) {
        redirect("/denied");
    }

    let parsedForm;
    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await prisma.user.findUnique({
                select: {
                    user_uid: true,
                    email: true,
                    role: true,
                    user_created_dt: true,
                    user_updated_dt: true,
                },
                where: {
                    user_uid: parsed_uid.data,
                },
            });
            const flattenResult = flattenNestedObject(result);
            parsedForm = readUserWithoutPassSchema.safeParse(flattenResult);
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.VarChar, parsed_uid)
                            .query`SELECT user_uid, email, role, user_created_dt, user_updated_dt 
                                    FROM "packing"."user"
                                    WHERE user_uid = @user_uid;
                            `;
            parsedForm = readUserWithoutPassSchema.safeParse(result.recordset[0]);
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

export async function updateRole(formData: FormData | unknown): StatePromise {

    if (!(formData instanceof FormData)) {
        throw new Error('Invalid input provided !');
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

    if (!session || session.user.role !== 'boss') {
        redirect("/denied");
    }

    try {
        
        if (parsedEnv.DB_TYPE === "PRISMA") {
            const result = await prisma.user.update({
                where: {
                    user_uid: parsedForm.data.user_uid,
                },
                data: parsedForm.data,
            });
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                            .input('role', sql.VarChar, parsedForm.data.role)
                            .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                            .query`UPDATE "packing"."user" 
                                    SET role = @role, user_updated_dt = @user_updated_dt
                                    WHERE user_uid = @user_uid;
                            `;
        }
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
        throw new Error('Invalid input provided !');
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

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    try {
        
        if (parsedEnv.DB_TYPE === "PRISMA") {
            const result = await prisma.user.update({
                where: {
                    user_uid: parsedForm.data.user_uid,
                    NOT: {
                        role: 'boss',
                    },
                },
                data: parsedForm.data,
            });
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                            .input('role', sql.VarChar, parsedForm.data.role)
                            .input('user_updated_dt', sql.DateTime, parsedForm.data.user_updated_dt)
                            .query`UPDATE "packing"."user" 
                                    SET role = @role, user_updated_dt = @user_updated_dt
                                    WHERE user_uid = @user_uid and role != 'boss';
                            `;
        }
    } 
    catch (err) {
        return { 
            error: {error: [getErrorMessage(err)]},
            message: "Invalid user provided, failed to update role!"
        };
    }

    return { message: `Successfully updated role for user ${parsedForm.data.user_uid}` }
};