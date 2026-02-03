"use client"

import { updateRole } from "@/app/_actions/auth";
import { notFound } from 'next/navigation';
import Breadcrumbs from "@/app/_components/basic/breadcrumbs";
import { TReadUserWithoutPassAdminSchema } from "@/app/_libs/zod_auth";
import FormWithoutState from "@/app/_components/basic/form_without_state";

type TUpdateRoleComponentProps = {
    user: TReadUserWithoutPassAdminSchema | null,
};

export default function UpdateRoleComponent({ user }: TUpdateRoleComponentProps) {

    if (!user) {
        notFound();
    }

    return (
        <>
            <Breadcrumbs breadcrumbs={[
                {label: "User", href: "/protected/auth/user", active: false},
                {label: `Update ${user.user_uid}`, href: `/protected/auth/user/${user.user_uid}/updateRole`, active: true}
            ]} />

            <FormWithoutState 
                formTitle="Update Role"
                inputType={{
                    'user_uid': 'hidden',
                    'username': 'readonly',
                    'role': 'select',
                }}
                rowData={user}
                selectOptionData={[{'role': 'user'}, {'role': 'admin'}]}
                action="update"
                formAction={updateRole}
                redirectLink="/protected/auth/user"
            />
        </>
    );
};