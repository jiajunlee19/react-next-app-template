export function TableSkeleton() {

    const rowSkeleton = <div className="h-6 w-24 rounded-xl bg-gray-100 dark:bg-gray-400/50" />;
    const actionRowSkeleton = 
        <div className="flex gap-1" >
            <div className="h-6 w-10 rounded-xl bg-gray-100 dark:bg-gray-400/50" />
            <div className="h-6 w-10 rounded-xl bg-gray-100 dark:bg-gray-400/50" />
        </div>;

    const rowData = {
        column0: rowSkeleton,
        column1: rowSkeleton,
        column2: rowSkeleton,
        column3: actionRowSkeleton,
    };

    const fetchedData = Array(10).fill(rowData);

    const tableHead =
    <tr>
        {Object.keys(rowData).map(key => {
            return (
                <th className="whitespace-nowrap p-1" key={key}>{rowSkeleton}</th>      
            );
        })}
    </tr>;

    const tableBody = fetchedData.map((row, i) => {
        const tableData = Object.keys(row).map(column => {
            return  <td className="whitespace-nowrap p-1" key={column}>{row[column]}</td>;
        });

        return (
            <tr key={i}>
                {tableData}
            </tr>
        );
    });

    return (
        <table>
            <thead>
                {tableHead}
            </thead>
            <tbody>
                {tableBody}
            </tbody>
        </table>
    );
};