import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { readUserByUsernameAdmin } from "@/app/_actions/auth";
import UpdateRoleComponent from '@/app/(pages)/protected/auth/updateRoleByUsername/component';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Update Role',
    description: 'Developed by jiajunlee',
};

export default async function UpdateRolePage(props: {searchParams?: Promise<{username?: string}>}) {
    const searchParams = await props.searchParams;

    const session = await getServerSession(options);

    if (!session || (session.user.role !== 'boss' && session.user.role !== 'admin')) {
        redirect("/denied");
    }

    const username = searchParams?.username?.toString() || session.user.username;
    let user;

    try {
        user = await readUserByUsernameAdmin(username);
    } catch (err) {
        user = null;
    }

    return (
       <UpdateRoleComponent user={user}/>
    );
};