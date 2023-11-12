"use client"

import { updateRole } from "@/app/_actions/auth";
import { useRef } from "react";
import { notFound } from 'next/navigation';
import Breadcrumbs from "@/app/_components/basic/breadcrumbs";
import { TReadUserWithoutPassSchema } from "@/app/_libs/zod_auth";
import FormWithoutState from "@/app/_components/basic/form_without_state";

type TUpdateRoleComponentProps = {
    user: TReadUserWithoutPassSchema | null,
};

export default function UpdateRoleComponent({ user }: TUpdateRoleComponentProps) {

    if (!user) {
        notFound();
    }

    const formRef = useRef<HTMLFormElement>(null);

    const handleUpdateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        
        const confirmMsg = 'Are you sure to update role for this user?'

        //if any button other than submit is clicked, preventDefault submit routing!
        if (!window.confirm(confirmMsg)) {
            e.preventDefault();
            return;
        };
        return; //proceed to submit form
    };

    return (
        <>
            <Breadcrumbs breadcrumbs={[
                {label: "User", href: "/restricted/auth/user", active: false},
                {label: `Update ${user.user_uid}`, href: `/restricted/auth/user/${user.user_uid}/updateRole`, active: true}
            ]} />

            <FormWithoutState 
                formTitle="Update Role"
                inputType={{
                    'user_uid': 'hidden',
                    'email': 'readonly',
                    'role': 'text',
                }}
                rowData={user}
                selectOptionData={null}
                action="update"
                formAction={updateRole}
                redirectLink="/restricted/auth/user"
            />
            
            {/* <form ref={formRef} action={ async (formData) => {
                        const result = await updateRole(formData);
                        if (result?.error && result?.message) {
                            toast.error(result.message);
                        }
                        else if (result?.message) {
                            toast.success(result.message);
                        }
                        formRef.current?.reset();
                    }
                }>
                <input name="user_uid" type="text" defaultValue={user?.user_uid || session.user.user_uid} readOnly formNoValidate />
                <label htmlFor="email">Email: </label>
                <input name="email" type="email" placeholder="Enter your email" defaultValue={user.email} required formNoValidate />
                <label htmlFor="role">Role: </label>
                <select name="role" defaultValue={user?.role || session.user.role } required>
                    {["user", "admin", "boss"].map((role) => {
                        if (role === (user?.role || session.user.role) ) {
                            return <option key={role} defaultValue={role}>{role}</option>
                        }
                        else {
                            return <option key={role} value={role}>{role}</option>
                        }
                    })}
                </select>
                <SubmitButton buttonClass="btn-ok w-40 mr-4 mt-4" buttonTitle="Update" onButtonClick={handleUpdateClick} submitingButtonTitle="Updating" />
                <button type="button" className="btn-cancel w-40 mr-4 mt-4" onClick={() => formRef.current?.reset()}>Reset</button>
            </form> */}
        </>
    );
};