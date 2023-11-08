// This is a seed script to load initial placeholder data to database, using "npm run seed"

import { users, shipdocs, box_types, tray_types, boxes, trays, lots } from "@/app/_scripts/data_placeholder";
import { signUpSchema } from "@/app/_libs/zod_auth";
import { parsedEnv } from "@/app/_libs/zod_env";
import prisma from "@/prisma/prisma";
import sql from 'mssql';
import { sqlConfig } from "@/app/_libs/sql_config";
import { getErrorMessage } from "@/app/_libs/error_handler";
import * as bcrypt from 'bcrypt';
import { createShipdocSchema } from "@/app/_libs/zod_server";

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
                .input('schema', sql.VarChar, 'packing')
                .input('table', sql.VarChar, 'user')
                .input('user_uid', sql.VarChar, d.user_uid)
                .input('email', sql.VarChar, d.email)
                .input('password', sql.VarChar, await bcrypt.hash(d.password, 10))
                .input('role', sql.VarChar, d.role)
                .input('user_createdAt', sql.DateTime, d.user_createdAt)
                .input('user_updatedAt', sql.DateTime, d.user_updatedAt)
                .query`INSERT INTO "@schema"."@table" 
                        (user_uid, email, password, role, user_createdAt, user_updatedAt)
                        VALUES (@user_uid, @email, @password, @role, @user_createdAt, @user_updatedAt);
                `;
            }));
        }
        return { success: `Successfully seed users` }
    } catch (err) {
        return { error: getErrorMessage(err)}
    }

};

async function seedShipdoc() {

    const parsedForm = createShipdocSchema.array().safeParse(shipdocs);

    if(!parsedForm.success) {
        return { error: parsedForm.error.message.split('"message": "').pop()?.split('",')[0] }
    }

    try {
        if (parsedEnv.DB_TYPE === 'PRISMA') {
            const result = await Promise.all(parsedForm.data.map( async (d) => {
                await prisma.shipdoc.create({
                    data: d,
                })
            }));
        }
        else {
            let pool = await sql.connect(sqlConfig);
            const result = await Promise.all(parsedForm.data.map( async (d) => {
                pool.request()
                .input('schema', sql.VarChar, 'packing')
                .input('table', sql.VarChar, 'user')
                .input('shipdoc_uid', sql.VarChar, d.shipdoc_uid)
                .input('shipdoc_number', sql.Int, d.shipdoc_number)
                .input('shipdoc_contact', sql.VarChar, d.shipdoc_contact)
                .input('shipdoc_createdAt', sql.DateTime, d.shipdoc_createdAt)
                .input('shipdoc_updatedAt', sql.DateTime, d.shipdoc_updatedAt)
                .query`INSERT INTO "@schema"."@table" 
                        (shipdoc_uid, shipdoc_number, shipdoc_contact, shipdoc_createdAt, shipdoc_updatedAt)
                        VALUES (@shipdoc_uid, @shipdoc_number, @shipdoc_contact, @shipdoc_createdAt, @shipdoc_updatedAt);
                `;
            }));
        }
        return { success: `Successfully seed shipdocs` }
    } catch (err) {
        return { error: getErrorMessage(err)}
    }

};

async function main() {
    console.log(await seedUser());
    console.log(await seedShipdoc());
};

// Run main
main()