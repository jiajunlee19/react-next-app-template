// This is a seed script to load initial placeholder data to database, using "npm run seed"

import { users, types } from "@/app/_scripts/data_placeholder";
import { signUpSchema } from "@/app/_libs/zod_auth";
import { parsedEnv } from "@/app/_libs/zod_env";
import prisma from "@/prisma/prisma";
import sql from 'mssql';
import { sqlConfig } from "@/app/_libs/sql_config";
import { getErrorMessage } from "@/app/_libs/error_handler";
import bcrypt from 'bcryptjs';
import { createTypeSchema } from "@/app/_libs/zod_server";

async function seedUser() {

    const parsedForm = signUpSchema.array().safeParse(users);

    if(!parsedForm.success) {
        return { error: parsedForm.error.message.split('"message": "').pop()?.split('",')[0] }
    }

    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await Promise.all(parsedForm.data.map( async (d) => {
                await prisma.user.create({
                    data: d,
                })
            }));
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await Promise.all(parsedForm.data.map( async (d) => {
                 pool.request()
                .input('user_uid', sql.VarChar, d.user_uid)
                .input('username', sql.VarChar, d.username)
                .input('password', sql.VarChar, await bcrypt.hash(d.password, 10))
                .input('role', sql.VarChar, d.role)
                .input('user_created_dt', sql.DateTime, d.user_created_dt)
                .input('user_updated_dt', sql.DateTime, d.user_updated_dt)
                .query`INSERT INTO [template].[user] 
                        (user_uid, username, password, role, user_created_dt, user_updated_dt)
                        VALUES (@user_uid, @username, @password, @role, @user_created_dt, @user_updated_dt);
                `;
            }));
        }
        return { success: `Successfully seed users` }
    } catch (err) {
        return { error: getErrorMessage(err)}
    }

};

async function seedType() {

    const parsedForm = createTypeSchema.array().safeParse(types);

    if(!parsedForm.success) {
        return { error: parsedForm.error.message.split('"message": "').pop()?.split('",')[0] }
    }

    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await Promise.all(parsedForm.data.map( async (d) => {
                await prisma.type.create({
                    data: d,
                })
            }));
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await Promise.all(parsedForm.data.map( async (d) => {
                pool.request()
                .input('type_uid', sql.VarChar, d.type_uid)
                .input('type', sql.VarChar, d.type)
                .input('type_created_dt', sql.DateTime, d.type_created_dt)
                .input('type_updated_dt', sql.DateTime, d.type_updated_dt)
                .query`INSERT INTO [template].[type] 
                        (type_uid, type, type_created_dt, type_updated_dt)
                        VALUES (@type_uid, @type, @type_created_dt, @type_updated_dt);
                `;
            }));
        }
        return { success: `Successfully seed type` }
    } catch (err) {
        return { error: getErrorMessage(err)}
    }

};


async function main() {
    console.log(await seedUser());
    console.log(await seedType());
};

// Run main
main()