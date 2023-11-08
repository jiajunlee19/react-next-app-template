'use server'

import { v5 as uuidv5 } from 'uuid';
import * as bcrypt from 'bcrypt';
import sql from 'mssql';
import { sqlConfig } from "@/app/_libs/sql_config";
import { type TEmailSchema, type TPasswordSchema, emailSchema, signInSchema, signUpSchema, readUserSchema, readUserWithoutPassSchema, updateUserSchema, deleteUserSchema, updateRoleSchema } from "@/app/_libs/zod_auth";
import { getErrorMessage } from '@/app/_libs/error_handler';
import { signJwtToken } from '@/app/_libs/jwt';
import { parsedEnv } from '@/app/_libs/zod_env';
import prisma from '@/prisma/prisma';

export const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);
const schema = 'packing';
const table = 'box_type';

export async function signIn(email: TEmailSchema, password: TPasswordSchema) {

    const parsedForm = signInSchema.safeParse({
        email: email,
        password: password,
    });

    if (!parsedForm.success) {
        return { error: parsedForm.error.message.split('"message": "').pop()?.split('",')[0] }
    };

    try {
        
        let parsedResult;
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
            parsedResult = readUserSchema.safeParse(result);
        }

        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('email', sql.VarChar, parsedForm.data.email)
                            .query`SELECT user_uid, email, password, role
                                    FROM "@schema"."@table"
                                    WHERE email = @email;
                            `;
            parsedResult = readUserSchema.safeParse(result.recordset);
        }
    
        if (!parsedResult.success) {
            return { error: parsedResult.error.message.split('"message": "').pop()?.split('",')[0] }
        };

        if (parsedResult.data.password && (await bcrypt.compare(parsedForm.data.password, parsedResult.data.password))) {
            const {password, ...userWithoutPassword} = parsedResult.data;
            const jwtToken = signJwtToken(userWithoutPassword);
            const userWithToken = {
                ...userWithoutPassword,
                jwtToken,
            };

            // revalidatePath('/');
            return userWithToken
        }
        else {
            return { error: "Invalid Credentials !" }
        }
    } 
    catch (err) {
        return { error: getErrorMessage(err)}
    }

};

export async function signUp(email: TEmailSchema, password: TPasswordSchema) {

    const now = new Date();

    const parsedForm = signUpSchema.safeParse({
        user_uid: uuidv5(email, UUID5_SECRET),
        email: email,
        password: password,
        role: 'user',
        user_createdAt: now,
        user_updatedAt: now,
    });

    if (!parsedForm.success) {
        return { error: parsedForm.error.message.split('"message": "').pop()?.split('",')[0] }
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
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                            .input('email', sql.VarChar, parsedForm.data.email)
                            .input('password', sql.VarChar, await bcrypt.hash(parsedForm.data.password, 10),)
                            .input('role', sql.VarChar, parsedForm.data.role)
                            .input('user_createdAt', sql.DateTime, parsedForm.data.user_createdAt)
                            .input('user_updatedAt', sql.DateTime, parsedForm.data.user_updatedAt)
                            .query`INSERT INTO "@schema"."@table" 
                                    (user_uid, email, password, role, user_createdAt, user_updatedAt)
                                    VALUES (@user_uid, @email, @password, @role, @user_createdAt, @user_updatedAt);
                            `;
        }

        return { success: `Successfully created user ${parsedForm.data.user_uid}` }
    } 
    catch (err) {
        return { error: getErrorMessage(err)}
    }

};

export async function updateUser(formData: FormData) {

    const now = new Date();

    const parsedForm = updateUserSchema.safeParse({
        user_uid: formData.get("user_uid"),
        password: formData.get("password"),
        user_updatedAt: now,
    });

    if (!parsedForm.success) {
        return { error: parsedForm.error.message.split('"message": "').pop()?.split('",')[0] }
    };

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
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                            .input('password', sql.VarChar, await bcrypt.hash(parsedForm.data.password, 10),)
                            .input('user_updatedAt', sql.DateTime, parsedForm.data.user_updatedAt)
                            .query`UPDATE "@schema"."@table" 
                                    SET password = @password, user_updatedAt = @user_updatedAt
                                    WHERE user_uid = @user_uid;
                            `;
        }

        return { success: `Successfully updated user ${parsedForm.data.user_uid}` }
    } 
    catch (err) {
        return { error: getErrorMessage(err)}
    }

};

export async function deleteUser(formData: FormData) {

    const now = new Date();

    const parsedForm = deleteUserSchema.safeParse({
        user_uid: formData.get("user_uid"),
    });

    if (!parsedForm.success) {
        return { error: parsedForm.error.message.split('"message": "').pop()?.split('",')[0] }
    };

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
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                            .query`DELETE FROM "@schema"."@table" 
                                    WHERE user_uid = @user_uid;
                            `;
        }

        return { success: `Successfully deleted user ${parsedForm.data.user_uid}` }
    } 
    catch (err) {
        return { error: getErrorMessage(err)}
    }

};

export async function updateRole(formData: FormData) {

    const now = new Date();

    const parsedForm = updateRoleSchema.safeParse({
        user_uid: formData.get("user_uid"),
        role: formData.get("role"),
        user_updatedAt: now,
    });

    if (!parsedForm.success) {
        return { error: parsedForm.error.message.split('"message": "').pop()?.split('",')[0] }
    };

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
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('user_uid', sql.VarChar, parsedForm.data.user_uid)
                            .input('role', sql.VarChar, parsedForm.data.role)
                            .input('user_updatedAt', sql.DateTime, parsedForm.data.user_updatedAt)
                            .query`UPDATE "@schema"."@table" 
                                    SET role = @role, user_updatedAt = @user_updatedAt
                                    WHERE user_uid = @user_uid;
                            `;
        }

        return { success: `Successfully updated role for user ${parsedForm.data.user_uid}` }
    } 
    catch (err) {
        return { error: getErrorMessage(err)}
    }

};

export async function getUserByEmail(email: TEmailSchema) {

    const parsedForm = emailSchema.safeParse(email);

    if (!parsedForm.success) {
        return { error: parsedForm.error.message.split('"message": "').pop()?.split('",')[0] }
    };

    try {
        
        let parsedResult;
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
            parsedResult = readUserWithoutPassSchema.safeParse(result);
        }

        else {
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                            .input('schema', sql.VarChar, schema)
                            .input('table', sql.VarChar, table)
                            .input('email', sql.VarChar, parsedForm.data)
                            .query`SELECT user_uid, email, role
                                    FROM "@schema"."@table"
                                    WHERE email = @email;
                            `;
            parsedResult = readUserWithoutPassSchema.safeParse(result.recordset);
        }
    
        if (!parsedResult.success) {
            return { error: parsedResult.error.message.split('"message": "').pop()?.split('",')[0] }
        };

        return parsedResult.data
        
    } 
    catch (err) {
        return { error: getErrorMessage(err)}
    }
};