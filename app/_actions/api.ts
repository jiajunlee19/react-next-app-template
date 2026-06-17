"server-only"

import { pgSqlConfig, msSqlConfig } from "@/app/_libs/sql_config";
import { parsedEnv } from "@/app/_libs/zod_env";
import { Pool } from "pg";
import sql from "mssql";
import ldap_client from '@/app/_libs/ldap';
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache'; 

export async function getWidgetsPG() {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgets");

    const pool = new Pool(pgSqlConfig);
    const result = await pool.query(
        `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers
        FROm "jiajunleeWeb"."widget" w
        ORDER BY w.widget_group asc;`
    );
    await pool.end();

    return result;
};

export async function getWidgetsMSSQL() {
    "use cache"
    cacheLife("max");
    cacheTag("readWidget", "readWidgets");

    let pool = await sql.connect(msSqlConfig);
    const result = await pool.query(
        `SELECT w.widget_uid, w.widget_name, w.widget_description, w.widget_group, w.widget_href, w.widget_tabs, w.widget_owners, w.widget_viewers
        FROm [jiajunleeWeb].[widget] w
        ORDER BY w.widget_group asc;`
    );
    await pool.close();

    return result;
};

export async function getGroupsLDAP(group: string) {
    "use cache"
    cacheLife("hours");
    cacheTag("checkIfUserInGroups");

    const searchResult = await ldap_client.search(parsedEnv.LDAP_GROUP_BASE_DN, {
        scope: 'sub',
        filter: `cn=${group}`,
        attributes: ["dn", "cn", "uniqueMember", "owner", "contactusername"],
        sizeLimit: 1,
    });

    return searchResult;
};