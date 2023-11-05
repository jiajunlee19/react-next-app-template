'use client'

import { type TInputType, type TFormMode, type TRowData } from "@/app/_libs/types";
import SubmitButton from "@/app/_components/basic/button_submit";
import Form from "@/app/_components/basic/form";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { accessNestedObject, createNestedObject } from "@/app/_libs/nested_object";
import { getString } from "@/app/_libs/toString_handler";

type MainProps = {
    fetchedData: TRowData[],
    inputTypeCreate: TInputType,
    inputTypeUpdate: TInputType,
    createButtonTitle: string,
    createFormTitle: string,
    updateFormTitle: string,
    columnListDisplay: string[],
    primaryKey: string,
    selectOptionData: TRowData[],
    selectPrimaryKey: string,
    selectPrimaryKeyList: string[],
    createAction: (formData: FormData) => Promise<{success?: string, error?: string}>,
    updateAction: (formData: FormData) => Promise<{success?: string, error?: string}>,
    deleteAction: (formData: FormData) => Promise<{success?: string, error?: string}>,
};

export default function Main( {fetchedData, inputTypeCreate, inputTypeUpdate, createButtonTitle, createFormTitle, updateFormTitle, columnListDisplay, primaryKey, selectOptionData, selectPrimaryKey, selectPrimaryKeyList, createAction, updateAction, deleteAction}: MainProps ) {
    
    // A state that controls whether a form should show, acceptable values: null/insert/update
    const [isShowForm, setIsShowForm] = useState<TFormMode>(null);   

    // Init rowData column keys accordingly based on isShowForm state
    let initRowData = fetchedData[0];
    if (isShowForm === 'create') {
        initRowData = Object.fromEntries(Object.entries(fetchedData[0] || {}).filter( ([key,val]) => Object.keys(inputTypeCreate).includes(key)));
    }
    else if (isShowForm === 'update') {
        initRowData = Object.fromEntries(Object.entries(fetchedData[0] || {}).filter( ([key,val]) => Object.keys(inputTypeUpdate).includes(key)));
    }


    // A state that controls rowData when form input changes
    const [rowData, setRowData] = useState<TRowData>(initRowData);


    const handleShowFormClick = (action: TFormMode) => (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsShowForm(action);
    };


    const handleUpdateClick = (d: TRowData) => (e: React.MouseEvent<HTMLButtonElement>) => {
        setRowData(d);
        setIsShowForm('update');
    };


    const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {

        const confirmMsg = 'Are you sure to delete this item?'

        //if any button other than submit is clicked, preventDefault submit routing!
        if (!window.confirm(confirmMsg)) {
            e.preventDefault();
            return;
        };
        return; //proceed to submit form
    };


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // set row data dynamically when input changes
        setRowData(
            {...rowData, [e.target.name]: e.target.value}
        );
    };

    const handleDynamicChange = (selectPrimaryKey: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        // creating nested object based on primaryKey hierachy list
        let selectOptionDict: {[key: string]: any} = {};
        selectOptionData?.forEach(row => {
            const hierachyList = selectPrimaryKeyList.map(column => {
                return getString(row[column]);
            });
            createNestedObject(selectOptionDict, hierachyList, row);
        });

        // this only applies to 'select' type, where an additional primaryKey will be changed at the same time
        if (e.target.value) {
            setRowData(
                {...rowData, [e.target.name]: e.target.value, [selectPrimaryKey]: selectOptionDict[e.target.value][selectPrimaryKey]}
                // {...rowData, [e.target.name]: e.target.value, [selectPrimaryKey]: accessNestedObject( selectOptionDict, [e.target.value, selectPrimaryKey] )}
            );
        };
    };


    const handleSubmitClick = (action: TFormMode) => (e: React.MouseEvent<HTMLButtonElement>) => {

        // set confirmMsg
        let confirmMsg = 'Confirm?';
        if (action === 'create') {
            confirmMsg = 'Are you sure to add this new item?';
        }
        
        else if (action === 'update') {
            confirmMsg = 'Are you sure to update this item?'
        }

        //if any button other than submit is clicked, preventDefault submit routing!
        if (!window.confirm(confirmMsg)) {
            e.preventDefault();
            return;
        };
        // onSetIsShowForm(null); //proceed to submit form
    };


    const handleCancelClick = () => {
        setIsShowForm(null);
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
                <td>
                    <button className="btn-primary p-1 mb-0.5" onClick={handleUpdateClick(fetchedData[i])}>update</button>
                    <br/>

                    <form action={ async (formData) => {
                                const result = await deleteAction(formData);
                                if (result?.error) {
                                    toast.error(result.error);
                                }
                                else if (result?.success) {
                                    toast.success(result.success);
                                }
                            }
                        }>
                        <input type="hidden" name={primaryKey} value={fetchedData[i][primaryKey].toString()} required readOnly formNoValidate/>
                        <SubmitButton buttonClass="btn-primary p-1 mb-0.5" buttonTitle="delete" onButtonClick={handleDeleteClick} submitingButtonTitle="deleting" />
                    </form>
                </td>
            </tr>
        );

    });


    return (
        <>
            <button className="btn-primary" onClick={handleShowFormClick('create')}>{createButtonTitle}</button>
            <Form formClassName={isShowForm === 'create' ? 'form-popout form-popout-show': 'form-popout form-popout-hide'} formTitle={createFormTitle} inputType={inputTypeCreate} rowData={rowData} selectOptionData={selectOptionData} onInputChange={handleInputChange} onDynamicChange={handleDynamicChange(selectPrimaryKey)} onSubmitClick={handleSubmitClick('create')} onCancelClick={handleCancelClick} formAction={createAction} />
            <Form formClassName={isShowForm === 'update' ? 'form-popout form-popout-show': 'form-popout form-popout-hide'} formTitle={updateFormTitle} inputType={inputTypeUpdate} rowData={rowData} selectOptionData={selectOptionData} onInputChange={handleInputChange} onDynamicChange={handleDynamicChange(selectPrimaryKey)} onSubmitClick={handleSubmitClick('update')} onCancelClick={handleCancelClick} formAction={updateAction} />

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