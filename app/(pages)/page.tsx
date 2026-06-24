import { HomeComponent } from "@/app/(pages)/component"
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { readAllWidget } from "@/app/_actions/widget";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Home',
    description: 'Developed by jiajunlee',
};

export default async function Home() {

    const session = await getServerSession(options);

    const widgets = await readAllWidget();

    return (
        <>
            <HomeComponent widgets={widgets} />
        </>
    )
};