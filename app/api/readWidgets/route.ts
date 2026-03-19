import { NextResponse } from "next/server";
import { pgSqlConfig, msSqlConfig } from "@/app/_libs/sql_config";
import { parsedEnv } from "@/app/_libs/zod_env";
import { getErrorMessage } from "@/app/_libs/error_handler";
import { Pool } from "pg";
import sql from "mssql";

export async function GET() {
    try {
        let rows: any[];

        if (parsedEnv.DB_TYPE === "PG") {
            const pool = new Pool(pgSqlConfig);
            const result = await pool.query(
                `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers
                FROm "jiajunleeWeb"."widget" w
                ORDER BY w.widget_group asc;`
            );
            rows = result.rows;
            await pool.end();
        } else {
            const pool = await sql.connect(msSqlConfig);
            const result = await pool.query(
                `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers
                FROm [jiajunleeWeb].[widget] w
                ORDER BY w.widget_group asc;`
            );
            rows = result.recordset;
        }

        const widgets = rows.map((row) => ({
            ...row,
            widget_tabs: Array.isArray(row.widget_tabs) ? row.widget_tabs :
                            (typeof row.widget_tabs === 'string' && row.widget_tabs ? JSON.parse(row.widget_tabs) : []),
            widget_owners: Array.isArray(row.widget_owners) ? row.widget_owners :
                            (typeof row.widget_owners === 'string' && row.widget_owners ? row.widget_owners.split(',') : []),    
            widget_viewers: Array.isArray(row.widget_viewers) ? row.widget_viewers :
                            (typeof row.widget_viewers === 'string' && row.widget_viewers ? row.widget_viewers.split(',') : []),      
        }));

        return NextResponse.json({ widgets });
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
};