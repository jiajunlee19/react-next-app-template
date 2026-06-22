import { NextResponse } from "next/server";
import { parsedEnv } from "@/app/_libs/zod_env";
import { getErrorMessage } from "@/app/_libs/error_handler";
import { getAllWidgetMSSQL, getAllWidgetPG } from "@/app/_actions/widget";

export async function GET() {
    try {
        let widgets: any[];

        if (parsedEnv.DB_TYPE === "PG") {
            const result = await getAllWidgetPG();
            widgets = result.rows;
        } else {
            const result = await getAllWidgetMSSQL();
            widgets = result.recordset;
        }

        return NextResponse.json({ widgets });
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
    }
};