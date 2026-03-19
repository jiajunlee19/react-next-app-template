import { HomeComponent } from "@/app/(pages)/component"
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { parsedEnv } from "@/app/_libs/zod_env";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Home',
    description: 'Developed by jiajunlee',
};

export default async function Home() {

    const session = await getServerSession(options);

    return (
        <>
            <HomeComponent baseUrl={parsedEnv.BASE_URL} />
        </>
    )
};