import ExcelJS from 'exceljs';

const HEADER_BOLD_FACTOR = 1.12;
const HEADER_FILTER_PADDING = 5;
const DATA_PADDING = 4;

export function autoFitColumns(worksheet: ExcelJS.Worksheet) {
    worksheet.columns?.forEach((column, colIndex) => {
        let maxLength = 10;
        let isDateColumn = false;

        const headerCell = worksheet.getRow(1).getCell(colIndex + 1).value;
        const header = (column.header ?? headerCell)?.toString() ?? '';

        const headerWidth = header.length * HEADER_BOLD_FACTOR + HEADER_FILTER_PADDING;

        column?.eachCell?.({ includeEmpty: true }, (cell, rowNumber) => {
            if (rowNumber === 1) return;

            const value = cell.value;

            if (value instanceof Date) {
                isDateColumn = true;
            }

            const cellText = value ? value.toString() : '';
            maxLength = Math.max(maxLength, cellText.length);
        });

        if (isDateColumn) {
            column.width = 20;
            column.numFmt = 'yyyy-mm-dd hh:mm:ss';
        } else {
            column.width = Math.ceil(Math.max(maxLength + DATA_PADDING, headerWidth));
        }
    });
} 