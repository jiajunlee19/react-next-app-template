'use server'

import { rateLimitByIP, rateLimitByUid } from "@/app/_libs/rate_limit";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { redirect } from "next/navigation";
import * as path from "path";
import * as fs from "fs";
import { writeFile, rm } from "fs/promises";

export async function uploadFile(formData: FormData | unknown, dirName: string | unknown) {
        
    if (!(formData instanceof FormData) || typeof dirName !== 'string' || !(formData.get('file') instanceof File)) {
        throw new Error('Invalid input provided !')
    };

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    if (await rateLimitByUid(session.user.user_uid, 20, 1000*60)) {
        redirect("/tooManyRequests");
    }

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
        await rm(dirPath, { recursive: true });

    } catch {
        return false
    }
    return true

};