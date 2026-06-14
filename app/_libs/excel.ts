import ExcelJS from 'exceljs';

export function autoFitColumns(worksheet: ExcelJS.Worksheet) {
    worksheet.columns?.forEach((column, colIndex) => {
        let maxLength = 10;
        let isDateColumn = false;

        // Include header length
        const header = column.header?.toString() ?? '';
        maxLength = Math.max(maxLength, header.length);

        column?.eachCell?.({ includeEmpty: true }, cell => {
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
            column.width = maxLength + 4;
        }
    });
} 