import { HomeComponent } from "@/app/(pages)/component"
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { readAllWidget } from "@/app/_actions/widget";
import { TReadWidgetSchema } from "@/app/_libs/zod_server";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Home',
    description: 'Developed by jiajunlee',
};

export default async function Home() {

    const session = await getServerSession(options);

    let widgets: TReadWidgetSchema[];
    try {
        widgets = await readAllWidget();
    } catch {
        widgets = [];
    }

    return (
        <>
            <HomeComponent widgets={widgets} />
        </>
    )
};