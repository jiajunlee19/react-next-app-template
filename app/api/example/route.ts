import { rateLimitByIP, rateLimitByUid } from "@/app/_libs/rate_limit";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { checkWidgetAccess } from "@/app/_libs/widgets";
import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/app/_libs/error_handler';
import ExcelJS from 'exceljs';
import { autoFitColumns } from '@/app/_libs/excel';
import { parsedEnv } from '@/app/_libs/zod_env';
import { v5 as uuidv5 } from 'uuid';
import { inputValuesSchema, selectedReportsSchema } from '@/app/_libs/zod_server';
import { type ServerResponse, type TRowData } from "@/app/_libs/types";
import { readSnowflakeService } from "@/app/_services/example";

const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);

export async function POST(req: Request) {

    try {

        const session = await getServerSession(options);

        if (!session) {
            return NextResponse.json({ message: ["You are unauthorized."] }, { status: 401 });
        }

        const { hasWidgetViewAccess, owners, viewers } = await checkWidgetAccess(parsedEnv.BASE_URL, "/authenticated/example", session.user.username, session.user.role);

        if (!hasWidgetViewAccess) {
            return NextResponse.json({ message: [`Access denied. You ae not part of the viewers (${viewers}). Kindly contact owners (${owners}) to get access,`] }, { status: 403 });
        }

        if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
            return NextResponse.json({ message: ["Too many requests, try again later."] }, { status: 429 });
        }

        const { input_values, selected_reports } = await req.json();
        const parsedInputValues = inputValuesSchema.safeParse(input_values);
        const parsedSelectedReports = selectedReportsSchema.safeParse(selected_reports);

        if (!parsedInputValues.success) {
            return NextResponse.json({ message: ["Invalid input values provided."] }, { status: 400 });
        }

        if (!parsedSelectedReports.success) {
            return NextResponse.json({ message: ["Invalid selected reports provided."] }, { status: 400 });
        }

        if (parsedInputValues.data.join('\n').length > 500) {
            return NextResponse.json({ message: ['Input values exceed 500 character limit.'] }, { status: 400 })
        }

        const workbook = new ExcelJS.Workbook();
        const errorSheet = workbook.addWorksheet('Error Summary');

        const errorRows: (string | Date)[][] = [];

        let err_count = 0;
        const dt_start = new Date();
        const report_uid = uuidv5(dt_start.toString(), UUID5_SECRET);
        const report_output = `Reports_${report_uid}.xlsx`;

        for (const report of JSON.stringify(parsedSelectedReports)) {
            let response: ServerResponse<TRowData[]>;
            let sheetName;

            const timestamp = new Date();

            switch (report) {
                case 'xxx':
                    sheetName = 'xxx';
                    response = await readSnowflakeService([]);
                    break;
                
                default:
                    sheetName = 'Unknown Report';
                    errorRows.push([timestamp, JSON.stringify(parsedInputValues.data), report, sheetName, '', `Unknown report - ${report}.`]);
                    err_count += 1;
                    continue;
            }

            if (!response.success) {
                // if the field are input field, return error to client and stop processing
                if (["Invalid Input"].includes(response.reason)) {
                    return NextResponse.json({ response }, { status: 400 });
                }

                if (response.error) {
                    for (const [field, messages] of Object.entries(response.error)) {
                        for (const msg of messages ?? []) {
                          errorRows.push([timestamp, JSON.stringify(parsedInputValues.data), report, sheetName, field, msg]);
                          err_count += 1;
                        }
                    }
                }

                else {
                    errorRows.push([timestamp, JSON.stringify(parsedInputValues.data), report, sheetName, '', response.message]);
                }
                
                continue;
            }

            const result = response.data;

            const dataSheet = workbook.addWorksheet(sheetName);
            const dataColumns = Object.keys(result[0]);
            dataSheet.addTable({
                name: sheetName.replace(/\s+/g, '_'),
                ref: 'A1',
                headerRow: true,
                totalsRow: false,
                style: {
                    theme: 'TableStyleMedium2',
                    showRowStripes: true,
                },
                columns: dataColumns.map(key => ({ name: key, filterButton: true })),
                rows: result.map(row => dataColumns.map(key => row[key] ?? '')),
            });

            autoFitColumns(dataSheet);
        }

        // Only add Error Summary Table if there are errors
        if (errorRows.length > 0) {
            errorSheet.addTable({
                name: 'Error_Summary',
                ref: 'A1',
                headerRow: true,
                totalsRow: false,
                style: {
                    theme: 'TableStyleLight1',
                    showRowStripes: true,
                },
                columns: [
                    { name: 'Timestamp', filterButton: true },
                    { name: 'Role', filterButton: true },
                    { name: 'Report ID', filterButton: true },
                    { name: 'Report Name', filterButton: true },
                    { name: 'Field', filterButton: true },
                    { name: 'Error Message', filterButton: true },
                ],
                rows: errorRows,
            });

            autoFitColumns(errorSheet);
        } else {
            // Delete the error summary worksheet if it has no rows
            workbook.removeWorksheet(errorSheet.id);
        }

        const buffer = await workbook.xlsx.writeBuffer();

        const dt_end = new Date();

        // Ingest into trace history db

        // Delete old trace history

        return new Response(buffer, {
            headers: {
                'Context-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filenamme="${report_output || 'Reports.xlsx'}"`,
                'X-Report-Filename': report_output || 'Reports.xlsx',
            },
        });

    } catch (err) {
        return NextResponse.json({ message: getErrorMessage(err) }, { status: 500 });
    }

};