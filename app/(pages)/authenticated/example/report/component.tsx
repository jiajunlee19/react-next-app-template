"use client"

import { getErrorMessage } from "@/app/_libs/error_handler";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ReportOption = {
    id: string,
    label: string;
};

type ReportsComponentProps = {
    inputTypeList: string[],
    reportOptions: {
        [role: string]: ReportOption[];
    }
}

export default function ReportsComponent( { inputTypeList, reportOptions }: ReportsComponentProps ) {

    const getValidInputTypes = () => Object.keys(reportOptions[inputType] ?? {});

    const [inputType, setInputType] = useState<string>(inputTypeList[0] ?? 'xxx');
    const [inputValues, setInputValues] = useState<string>('');
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const isMounted = useRef(false);

    // Update url params on load
    const searchParams = useSearchParams();
    useEffect(() => {
        const paramsInputType = searchParams.get('inputType');
        const validInputTypes = getValidInputTypes();
        const validInputType = (paramsInputType && validInputTypes.includes(paramsInputType)) ? paramsInputType : (validInputTypes[0] ?? 'xxx');
        setInputType(validInputType);

        const validReports = (reportOptions[validInputType] ?? []).map(report => report.id);
        const validSelectedReports : string[] = [];
        validReports.forEach(report => {
            if (searchParams.get(report) === 'true') {
                validSelectedReports.push(report);
            }
        });
        setSelectedReports(validSelectedReports);
    }, [searchParams]);

    // Sync states with url params
    useEffect(() => {
        const params = new URLSearchParams();
        if (inputType) params.set('inputType', inputType);
        selectedReports.forEach(report => {
            params.set(report, 'true');
        });
        window.history.replaceState({}, '', `?${params.toString()}`);
    }, [inputType, selectedReports]);

    // Reset invalid selected reports when inputType changes
    useEffect(() => {
        if (!isMounted.current) {
            return;
        }
        const validReports = (reportOptions[inputType] ?? []).map(report => report.id);
        setSelectedReports(prev => prev.filter(report => validReports.includes(report)));
    }, [inputType]);

    const currentReportOptions = reportOptions[inputType] ?? [];
    const currentInputTypeList = getValidInputTypes().length > 0 ? getValidInputTypes() : inputTypeList;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const endpoint = '/api/example';
            const res= await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputType: inputType,
                    inputValues: inputValues.split('\n').map(v => v.trim()).filter(v => v.length > 0),
                    selectedReports: selectedReports,
                }),
            });

            if (!res.ok) {
                const errMsg = (await res.json()).error;
                throw new Error(`[Error ${res.status} ${res.statusText}] ${JSON.stringify(errMsg)}`);
            }

            const blob = await res.blob();
            const filename = res.headers.get('X-Report-Filename') || 'Reports.xlsx';

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
        } catch (err) {
            alert('Failed to generate reports.\n\n' + getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-xl">
            <h2 className="mb-8">Generate Reports</h2>

            <label className="mb-2">Input Type:</label>
            <select value={inputType} onChange={e => setInputType(e.target.value)} className="mmb-4 p-2">
                {currentInputTypeList.map(id => (
                    <option key={id} value={id}>{id}</option>
                ))}
            </select>

            <label className="mb-2"> Enter {inputType} values (line-separated, max 500 chars):</label>
            <textarea
                value={inputValues}
                onChange={e => setInputValues(e.target.value)}
                className="mb-2 p-2"
                rows={4}
                maxLength={500}
            />
            <p className="text-sm mb-4">
                {inputValues.length} / 500 chars
            </p>

            <label className="block mb-2 font-medium">Report Output Options:</label>
            <div className="block w-full border rounded-sm mb-2 border-black dark:border-white">
                {currentReportOptions.map(option => (
                    <label key={option.id} className="flex">
                        <input 
                            type="checkbox"
                            value={option.id}
                            checked={selectedReports.includes(option.id)}
                            onChange={e => {
                                const checked = e.target.checked;
                                setSelectedReports(prev =>
                                    checked ? [...prev, option.id] : prev.filter(id => id !== option.id)
                                );
                            }}
                            className="w-min mx-2"
                        />
                        {option.label}
                    </label>
                ))}
            </div>
            <p className="text-sm mb-4">
                {selectedReports.length} report(s) selected. Download time may increase with more reports selected.
            </p>

            <button
                onClick={handleSubmit}
                disabled={loading || !inputValues || selectedReports.length === 0}
                className="btn btn-primary px-4 py-2 mt-4"
            >
                {loading ? 'Downloading Reports ...' : 'Download Reports'}
            </button>
        </div>
    );
};