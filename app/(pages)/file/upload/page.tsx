import UploadForm from '@/app/_components/form_upload';
import { type DropzoneOptions } from 'react-dropzone';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Upload File',
    description: 'Developed by jiajunlee',
};

export default async function FileUploadPage() {
    
    const dropzoneOptions: Omit<DropzoneOptions, 'disabled'> = {
        // Refer here for accepted Mime types
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
        accept: {
            'text/plain': ['.txt'], 
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xlsm'], 
            'application/xml': ['.pp', '.pp7']
        },
        multiple: false,
        maxFiles: 1,
        maxSize: 1024 * 1,
    };

    return (
        <>
            <h1>Upload File</h1>
            <UploadForm dropzoneOptions={dropzoneOptions} />
        </>
    );
};