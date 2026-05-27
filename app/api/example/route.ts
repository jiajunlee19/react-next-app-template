import { NextResponse } from 'next/server';
import { readSnowflake } from '@/app/_actions/example';
import { getErrorMessage } from '@/app/_libs/error_handler';
import ExcelJS from 'exceljs';
import { autoFitColumns } from '@/app/_libs/excel';
import { parsedEnv } from '@/app/_libs/zod_env';
import { v5 as uuidv5 } from 'uuid';
import { inputValuesSchema, selectedReportsSchema } from '@/app/_libs/zod_server';

const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);

export async function POST(req: Request) {

    try {
        const { input_values, selected_reports } = await req.json();
        const parsedInputValues = inputValuesSchema.safeParse(input_values);
        const parsedSelectedReports = selectedReportsSchema.safeParse(selected_reports);

        if (!parsedInputValues.success) {
            return NextResponse.json({
                error: parsedInputValues.error.errors.map(e => ({
                    field: 'input_values',
                    message: e.message,
                }))
            }, { status: 400 });
        }

        if (!parsedSelectedReports.success) {
            return NextResponse.json({
                error: parsedSelectedReports.error.errors.map(e => ({
                    field: 'selected_reports',
                    message: e.message,
                }))
            }, { status: 400 });
        }

        if (parsedInputValues.data.join('\n').length > 500) {
            return NextResponse.json({ error: ['Input values exceed 500 character limit.'] })
        }

        const workbook = new ExcelJS.Workbook();
        const errorSheet = workbook.addWorksheet('Error Summary');

        const errorRows: (string | Date)[][] = [];

        let err_count = 0;
        const dt_start = new Date();
        const report_uid = uuidv5(dt_start.toString(), UUID5_SECRET);
        const report_output = `Reports_${report_uid}.xlsx`;

        for (const report of JSON.stringify(parsedInputValues.data)) {
            let sheetName;
            let result: { error: string[] | { field: string, message: string }[], data?: undefined} | { data: any[], error?: undefined };

            const timestamp = new Date();

            switch (report) {
                case 'xxx':
                    sheetName = 'xxx';
                    result = await readSnowflake();
                    break;
                
                default:
                    sheetName = 'Unknown Report';
                    errorRows.push([timestamp, JSON.stringify(parsedInputValues.data), report, sheetName, '', `Unknown report - ${report}.`]);
                    err_count += 1;
                    continue;
            }

            if ('error' in result) {
                if (Array.isArray(result.error)) {
                    if (typeof result.error[0] === "string") {
                        for (const errMsg of result.error as string[]) {
                            errorRows.push([timestamp, JSON.stringify(parsedInputValues.data), report, sheetName, '', errMsg]);
                            err_count += 1;
                        }
                    }
                    else {
                        // error is array of objects (field-message pairs)
                        for (const errObj of result.error as { field: string, message: string }[]) {
                            if (['roleList'].includes(errObj.field)) {
                                // if the field are input field, return error to client and stop processing
                                return NextResponse.json({ error: result.error }, { status: 400 });
                            }
                            errorRows.push([timestamp, JSON.stringify(parsedInputValues.data), report, sheetName, errObj.field, errObj.message]);
                            err_count += 1;
                        }
                    }
                } else {
                    // error is not a list, invalid
                    errorRows.push([timestamp, JSON.stringify(parsedInputValues.data), report, sheetName, '', 'Unknown error format.']);
                    err_count += 1;
                }
                continue;
            }

            const dataSheet = workbook.addWorksheet(sheetName);
            const dataColumns = Object.keys(result.data[0]);
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
                rows: result.data.map(row => dataColumns.map(key => row[key] ?? '')),
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
        return NextResponse.json({ error: [getErrorMessage(err)] }, { status: 500 });
    }

};