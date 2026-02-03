// This is a seed script to load initial placeholder data to database, using "npm run seed"

import { users } from "@/app/_scripts/data_placeholder";
import { signUpSchema } from "@/app/_libs/zod_auth";
import sql from 'mssql';
import { sqlConfig } from "@/app/_libs/sql_config";
import { getErrorMessage } from "@/app/_libs/error_handler";
import bcrypt from 'bcryptjs';

async function seedUser() {

    const parsedForm = signUpSchema.array().safeParse(users);

    if(!parsedForm.success) {
        return { error: parsedForm.error.message.split('"message": "').pop()?.split('",')[0] }
    }

    try {
        let pool = await sql.connect(sqlConfig);
        const result = await Promise.all(parsedForm.data.map( async (d) => {
                pool.request()
            .input('user_uid', sql.VarChar, d.user_uid)
            .input('username', sql.VarChar, d.username)
            .input('password', sql.VarChar, await bcrypt.hash(d.password, 10))
            .input('role', sql.VarChar, d.role)
            .input('user_created_dt', sql.DateTime, d.user_created_dt)
            .input('user_updated_dt', sql.DateTime, d.user_updated_dt)
            .query`INSERT INTO [jiajunleeWeb].[user] 
                    (user_uid, username, password, role, user_created_dt, user_updated_dt)
                    VALUES (@user_uid, @username, @password, @role, @user_created_dt, @user_updated_dt);
            `;
        }));
        return { success: `Successfully seed users` }
    } catch (err) {
        return { error: getErrorMessage(err)}
    }

};

async function main() {
    console.log(await seedUser());
};

// Run main
main()