import { NextResponse } from "next/server";
import { parsedEnv } from "@/app/_libs/zod_env";
import { getErrorMessage } from "@/app/_libs/error_handler";
import { getWidgetsMSSQL, getWidgetsPG } from "@/app/_actions/api";

export async function GET() {
    try {
        let rows: any[];

        if (parsedEnv.DB_TYPE === "PG") {
            const result = await getWidgetsPG();
            rows = result.rows;
        } else {
            const result = await getWidgetsMSSQL();
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