'use client'

import { type TRowData, type State, type StatePromise } from "@/app/_libs/types";
import { getString } from "@/app/_libs/toString_handler";
import UpdateButton from "./basic/button_update";
import DeleteButton from "./basic/button_delete";

type DataTableProps = {
    fetchedData: TRowData[],
    columnListDisplay: string[],
    hrefUpdate: string,
    primaryKey: string,
    deleteAction: (deleteId: string) => StatePromise, 
};

export default function DataTable( {fetchedData, columnListDisplay, primaryKey, hrefUpdate, deleteAction}: DataTableProps ) {
    
    // Filter columns based on columnList provided
    const filteredData = fetchedData.map((row) => {
        return Object.fromEntries(Object.entries(row).filter( ([key,val]) => columnListDisplay.includes(key)));
    });
    

    //taking 1st fetched data row key to generate table headers
    const tableHead =
        <tr>
            {Object.keys(filteredData[0] || {}).map(key => {
                return (
                    <th key={key}>{key}</th>      
                );
            })}
            <th>action</th>
        </tr>;


    //taking fetched data rows as table body
    const tableBody = filteredData.map((row, i) => {
        const tableData = Object.keys(row).map(column => {
            return  <td key={column}>{getString(row[column])}</td>;
        });
        
        return (
            //use each table row UID as key value 
            <tr key={fetchedData[i][primaryKey].toString()}>
                {tableData}
                <td className="flex gap-1 justify-center align-middle">
                    <UpdateButton href={hrefUpdate.replace("[placeholder-id]", fetchedData[i][primaryKey].toString())} />
                    <DeleteButton deleteId={fetchedData[i][primaryKey].toString()} deleteAction={deleteAction} />
                </td>
            </tr>
        );

    });

    return (
        <>
            <table>
                <thead>
                    {tableHead}
                </thead>
                <tbody>
                    {tableBody}
                </tbody>
            </table>
        </>
    );
};