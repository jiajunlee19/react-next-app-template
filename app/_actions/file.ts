'use server'

import * as path from "path";
import * as fs from "fs";
import { writeFile, rmdir } from "fs/promises";

export async function uploadFile(formData: FormData, dirName: string) {
        
    const file: File = formData.get('file') as File;

    if (!file) {
        throw new Error("No file uploaded !")
    }

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // const rootDir = process.cwd();
        // const dirPath = path.join(rootDir, dirName);

        const dirPath = path.resolve("./public", dirName);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, {recursive: true});
        }

        const fileName = file.name.substring(0, file.name.lastIndexOf("."));
        const extension = file.name.substring( file.name.lastIndexOf(".") );

        const filePath = path.join(dirPath, fileName + extension );
        await writeFile(filePath, buffer);

    } catch {
        return false
    }
    return true

};

export async function deleteDir(dirName: string) {

    try {
        const dirPath = path.resolve("./public", dirName);
        await rmdir(dirPath, { recursive: true });

    } catch {
        return false
    }
    return true

};