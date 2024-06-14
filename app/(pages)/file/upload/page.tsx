import { deleteDir } from '@/app/_actions/file';
import UploadForm from '@/app/_components/form_upload';
import { type DropzoneOptions } from 'react-dropzone';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Upload File',
    description: 'Developed by jiajunlee',
};

export default async function FileUploadPage() {

    // Generic dropzone
    const dropzoneOptions: Omit<DropzoneOptions, 'disabled'> = {
        // Refer here for accepted Mime types
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
        accept: {
            'text/plain': ['.txt'], 
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xlsm'], 
            'application/xml': ['.pp', '.pp7'],
        },
        multiple: false,
        maxFiles: 1,
        maxSize: 1024 * 1000 * 5,
    };

    // pp dropzone
    const dropzoneOptions_pp: Omit<DropzoneOptions, 'disabled'> = {
        accept: {
            'application/xml': ['.pp'],
        },
        multiple: false,
        maxFiles: 1,
        maxSize: 1024 * 1000 * 5,
    };

    // pp7 dropzone
    const dropzoneOptions_pp7: Omit<DropzoneOptions, 'disabled'> = {
        accept: {
            'application/xml': ['.pp7'],
        },
        multiple: false,
        maxFiles: 1,
        maxSize: 1024 * 1000 * 5,
    };

    // Define file uploader
    const fileUploaders = [
        { id: 1, name: "PNP PROGRAM SIDE 1 MACHINE 1", dirName: "files/pp_11", dropZoneOptions: dropzoneOptions_pp},
        { id: 2, name: "PNP PROGRAM SIDE 1 MACHINE 2", dirName: "files/pp_12", dropZoneOptions: dropzoneOptions_pp},
        { id: 3, name: "PNP PROGRAM SIDE 1 MACHINE 3", dirName: "files/pp_13", dropZoneOptions: dropzoneOptions_pp7},

        { id: 4, name: "PNP PROGRAM SIDE 2 MACHINE 1", dirName: "files/pp_21", dropZoneOptions: dropzoneOptions_pp},
        { id: 5, name: "PNP PROGRAM SIDE 2 MACHINE 2", dirName: "files/pp_22", dropZoneOptions: dropzoneOptions_pp},
        { id: 6, name: "PNP PROGRAM SIDE 2 MACHINE 3", dirName: "files/pp_23", dropZoneOptions: dropzoneOptions_pp7},
    ]
    
    // Clear files when the page reloads, to avoid storage issues
    await deleteDir("files");


    return (
        <>
            <h1>Upload File</h1>

            <div className="flex flex-col gap-6">
                {fileUploaders.map(fileUploader => {
                    return (
                        <div key={fileUploader.name} className="flex flex-col gap-0">
                            <h3>{fileUploader.name}</h3>
                            <UploadForm dirName={fileUploader.dirName} dropzoneOptions={fileUploader.dropZoneOptions} />
                        </div>
                    )
                })}
            </div>

        </>
    );
};