import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { readUserByEmail } from "@/app/_actions/auth";
import UpdateRoleComponent from '@/app/(pages)/restricted/updateRole/component';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Template App - Update Role',
    description: 'Developed by jiajunlee',
};

export default async function UpdateRolePage() {

    const session = await getServerSession();

    if (!session) {
        redirect("/denied");
    }

    const user = await readUserByEmail(session.user.email);

    // const user = await readUserByEmail(searchParams.get("email")?.toString() || session.user.email);

    return (
       <UpdateRoleComponent user={user}/>
    );
};