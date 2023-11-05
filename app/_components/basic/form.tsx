import React, { useRef } from "react";
import SubmitButton from "@/app/_components/basic/button_submit";
import { type TInputType, type TRowData } from "@/app/_libs/types";
import { toast } from "react-hot-toast";
import { getString } from "@/app/_libs/toString_handler";

type FormProps = {
    formClassName: string,
    formTitle: string,
    inputType: TInputType,
    rowData: TRowData,
    selectOptionData: TRowData[],
    onInputChange: React.ChangeEventHandler, 
    onDynamicChange: React.ChangeEventHandler, 
    onSubmitClick: React.MouseEventHandler, 
    onCancelClick: React.MouseEventHandler, 
    formAction: (formData: FormData) => Promise<{success?: string, error?: string}>, 
};

export default function Form( {formClassName, formTitle, inputType, rowData, selectOptionData, onInputChange, onDynamicChange, onSubmitClick, onCancelClick, formAction}: FormProps ) {

    // declare formRef, we can perform form-related action based on this later
    const formRef = useRef<HTMLFormElement>(null);


    // Generate select options
    function generateSelectOption(key: string, selectOptionData: TRowData[]): React.JSX.Element[] {

        // map each row into select option
        const selectOption = selectOptionData.map((row) => {

            return (
                <option key={getString(row?.[key])} value={getString(row?.[key])}>{getString(row?.[key])}</option>
            );
        });

        return selectOption;
    };


    // Generate form inputs
    function generateFormInput(inputType: TInputType, rowData: TRowData, selectOptionData: TRowData[]) {

        const inputs = Object.keys(inputType).map(key => {

            if (inputType[key] === 'hidden') {
                return (
                    <React.Fragment key={key}>
                        <input name={key} className="input" type="text" placeholder="placeholder" value={getString(rowData?.[key])} onChange={onInputChange} required readOnly hidden formNoValidate />
                    </React.Fragment>
                );
            }

            else if (inputType[key] === 'readonly') {
                return (
                    <React.Fragment key={key}>
                        <label className="label" htmlFor={key}>{key}: </label>
                        <input name={key} className="input" type="text" placeholder="placeholder" value={getString(rowData?.[key])} onChange={onInputChange} required readOnly formNoValidate />
                    </React.Fragment>
                );
            }

            else if (inputType[key] === 'select') {
                return (
                    <React.Fragment key={key}>
                        <label className="label" htmlFor={key}>{key}: </label>
                        <select name={key} className="input" onChange={onDynamicChange} required>
                            <option value=""></option>
                            {generateSelectOption(key, selectOptionData)}
                        </select>
                    </React.Fragment>
                );
            }

            else if (inputType[key] === 'dynamic') {
                return (
                    <React.Fragment key={key}>
                        <label className="label" htmlFor={key}>{key}: </label>
                        <input name={key} className="input" type="text" placeholder="placeholder" value={getString(rowData?.[key])} onChange={onInputChange} required readOnly formNoValidate />
                    </React.Fragment>
                );
            }

            else if (inputType[key] === 'number') {
                return (
                    <React.Fragment key={key}>
                        <label className="label" htmlFor={key}>{key}: </label>
                        <input name={key} className="input" type="number" step="any" onChange={onInputChange} required formNoValidate />
                    </React.Fragment>
                );
            }

            else {
                return (
                    <React.Fragment key={key}>
                        <label className="label" htmlFor={key}>{key}: </label>
                        <input name={key} className="input" type={inputType[key]} onChange={onInputChange} required formNoValidate />
                    </React.Fragment>
                );
            }
        });

        return (
            <>{inputs}</>
        );
    };


    return (
        <div className={formClassName}>
            <form ref={formRef} className="my-[2%] mx-[2%]" action={ async (formData) => {
                        const result = await formAction(formData);
                        if (result?.error) {
                            toast.error(result.error);
                        }
                        else if (result?.success) {
                            toast.success(result.success);
                        }
                        formRef.current?.reset();
                    }
                }>
                <h2>{formTitle}</h2>
                {generateFormInput(inputType, rowData, selectOptionData)}
                <SubmitButton buttonClass="btn-ok w-40 mr-4 mt-4" buttonTitle="Submit" onButtonClick={onSubmitClick} submitingButtonTitle="Submitting" />
                <button type="button" className="btn-cancel w-40 mr-4 mt-4" onClick={onCancelClick}>Close</button>
                <button type="button" className="btn-cancel w-40 mr-4 mt-4" onClick={() => formRef.current?.reset()}>Reset</button>
            </form>
        </div>
    );
};