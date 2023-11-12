import { readUserById, updateRole } from "@/app/_actions/auth";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { redirect } from "next/navigation";
import type { Metadata } from 'next'
import UpdateRoleComponent from "@/app/(pages)/restricted/auth/user/[user_uid]/updateRole/component";

export const metadata: Metadata = {
    title: 'Update Role',
    description: 'Developed by jiajunlee',
};

export default async function UpdateRole({params}: {params: {user_uid: string}}) {
    
    const session = await getServerSession(options);

    if (!session || session.user.role !== 'boss') {
        redirect("/denied");
    }

    const user_uid = params.user_uid;

    let user;
    try {
        [user] = await Promise.all([
            readUserById(user_uid)
        ]);
    } catch (err) {
        [user] = [null];
    }


    return (
        <UpdateRoleComponent user={user} />
    );

};