import UploadForm from '@/app/_components/form_upload';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Upload File',
    description: 'Developed by jiajunlee',
};

export default async function FileUploadPage() {
    
    return (
        <>
            <h1>Upload File</h1>
            <UploadForm multiFile={true} />
        </>
    );
};