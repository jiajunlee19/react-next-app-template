"use client"

// https://edgestore.dev/docs/components/multi-file

import { uploadFile } from "@/app/_actions/file";
import { MultiFileDropzone, type FileState } from "@/app/_components/basic/multifile_dropzone";
import { type DropzoneOptions } from 'react-dropzone';
import { useState } from 'react';

type TUploadFileProps = {
    dirName: string,
    dropzoneOptions?: Omit<DropzoneOptions, 'disabled'>,
};

export default function UploadForm({ dirName, dropzoneOptions }: TUploadFileProps) {
    
    const [fileStates, setFileStates] = useState<FileState[]>([]);

    function updateFileProgress(key: string, progress: FileState['progress']) {
        setFileStates((fileStates) => {
          const newFileStates = structuredClone(fileStates);
          const fileState = newFileStates.find(
            (fileState) => fileState.key === key,
          );
          if (fileState) {
            fileState.progress = progress;
          }
          return newFileStates;
        });
    };

    const handleFilesAdded = async (addedFiles: FileState[]) => {
        setFileStates([...fileStates, ...addedFiles]);
        addedFiles.map(async (addedFileState) => {
            const formData = new FormData();
            formData.append("file", addedFileState.file);

            const result = await uploadFile(formData, dirName)
            // await new Promise((resolve) => setTimeout(resolve, 1000));
            if (result) {
                updateFileProgress(addedFileState.key, 'COMPLETE');
            }
            else {
                updateFileProgress(addedFileState.key, 'ERROR');
            }
        });
    };

    return (
        <>
            <MultiFileDropzone dropzoneOptions={dropzoneOptions} value={fileStates} onChange={(files) => setFileStates(files)} onFilesAdded={handleFilesAdded} />
        </>
    );
};