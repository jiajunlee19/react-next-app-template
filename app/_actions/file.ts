'use server'

import * as path from "path";
import * as fs from "fs";
import { writeFile } from "fs/promises";

export async function uploadFile(formData: FormData) {
        
    const file: File = formData.get('file') as File;

    if (!file) {
        throw new Error("No file uploaded !")
    }

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const rootDir = process.cwd();
        const dirPath = path.join(rootDir, "public", 'files');

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, {recursive: true});
        }

        const filePath = path.join(dirPath, file.name)
        await writeFile(filePath, buffer);

    } catch {
        return false
    }
    return true

};