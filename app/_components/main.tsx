'use client'

import { type TInputType, type TFormMode, type TRowData, type State, type StatePromise } from "@/app/_libs/types";
import SubmitButton from "@/app/_components/basic/button_submit";
import Form from "@/app/_components/basic/form";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { accessNestedObject, createNestedObject } from "@/app/_libs/nested_object";
import { getString } from "@/app/_libs/toString_handler";
import Link from "next/link";
import { useFormState } from "react-dom";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

type MainProps = {
    fetchedData: TRowData[],
    createButtonTitle: string,
    columnListDisplay: string[],
    primaryKey: string,
    deleteAction: (prevState: State, formData: FormData) => StatePromise, 
};

export default function Main( {fetchedData, createButtonTitle, columnListDisplay, primaryKey, deleteAction}: MainProps ) {
    
    const initialState  = { message: null, errors: {} };
    const [state, dispatch] = useFormState(deleteAction, initialState);

    const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {

        const confirmMsg = 'Are you sure to delete this item?'

        //if any button other than submit is clicked, preventDefault submit routing!
        if (!window.confirm(confirmMsg)) {
            e.preventDefault();
            return;
        };
        return; //proceed to submit form
    };

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
                    <Link className="no-underline text-white dark:text-emerald-400 hover:text-white hover:dark:text-emerald-400" href={`/box_type/${fetchedData[i][primaryKey]}/update`}>
                        <button className="btn-primary w-min p-1">
                            <PencilIcon className="h-5" />
                        </button>
                    </Link>

                    <form action={dispatch}>
                        <input type="hidden" name={primaryKey} value={fetchedData[i][primaryKey].toString()} required readOnly formNoValidate/>
                        <SubmitButton buttonClass="btn-primary w-min p-1" buttonTitle={<TrashIcon className="h-5" />} onButtonClick={handleDeleteClick} submitingButtonTitle={<TrashIcon className="h-5" />} />
                    </form>
                </td>
            </tr>
        );

    });

    if (state.message && state.error) {
        toast.error(state.message);
    }
    else if (state.message) {
        toast.success(state.message);
    }


    return (
        <>
            <Link className="no-underline text-white dark:text-emerald-400 hover:text-white hover:dark:text-emerald-400" href="/box_type/create">
                <button className="btn-primary w-min">
                    {createButtonTitle}
                </button>
            </Link>

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