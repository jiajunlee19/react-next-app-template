import { HomeComponent } from "@/app/(pages)/component"
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Home',
    description: 'Developed by jiajunlee',
};

export default async function Home() {

    const session = await getServerSession(options);

    return (
        <>
            <HomeComponent />
        </>
    )
};