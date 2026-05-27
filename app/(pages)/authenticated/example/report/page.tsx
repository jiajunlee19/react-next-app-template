import { Metadata } from 'next';
import ReportsComponent from '@/app/(pages)/authenticated/example/report/component';
import { inputTypeList } from '@/app/_libs/zod_server';

export const metadata: Metadata = {
    title: 'Reports',
    description: 'Developer by jiajunlee',
};

export default async function ReportsPage() {

    // Make sure to define reportSchema in zod_server and the report case switching in /api/example
    const reportOptions = {
        xxx: [
            { id: 'xxx', label: 'Include xxx Report' }
        ]
    }

    return (
        <>
            <ReportsComponent inputTypeList={inputTypeList} reportOptions={reportOptions} />
        </>
    )

};