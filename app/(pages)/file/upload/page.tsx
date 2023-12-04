import UploadForm from '@/app/_components/form_upload';
import { type DropzoneOptions } from 'react-dropzone';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Upload File',
    description: 'Developed by jiajunlee',
};

export default async function FileUploadPage() {
    
    const dropzoneOptions: Omit<DropzoneOptions, 'disabled'> = {
        // accept: { 'image/*': [] },
        multiple: true,
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