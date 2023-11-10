'use client'

import { updateUser, deleteUser, getUserByEmail } from "@/app/_actions/auth";
import SubmitButton from "@/app/_components/basic/button_submit";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useRef } from "react";
import { toast } from "react-hot-toast";

export default function UpdateRoleComponent() {

    const { data: session } = useSession();

    if (!session) {
        redirect("/denied");
    }

    const formRef = useRef<HTMLFormElement>(null);
    const emailRef = useRef("");
    const roleRef = useRef("");

    async function userRef()  {
        const result = await getUserByEmail(emailRef?.current);
        if ("error" in result) {
            toast.error(result.message);
            return ""
        }
        else {
            return result.user_uid
        }
    };

    const handleSubmitClick = (e: React.MouseEvent<HTMLButtonElement>) => {

        const input = window.prompt("Are you sure to delete this user?\nIf yes, enter 'delete' to confirm, this action cannot be undone.")
        if (input?.toLowerCase() !== 'delete') {
            e.preventDefault();
            return;
        }
    };

    return (
        <>
            <h1>Update Role</h1>
            
            <form ref={formRef} action={ async (formData) => {
                        const result = await updateUser(formData);
                        if (result?.error && result?.message) {
                            toast.error(result.message);
                        }
                        else if (result?.message) {
                            toast.success(result.message);
                        }
                        formRef.current?.reset();
                    }
                }>
                <input name="user_uid" type="text" defaultValue={session.user.user_uid} readOnly formNoValidate />
                <label htmlFor="email">Email: </label>
                <input name="email" type="email" placeholder="Enter your email" defaultValue={session.user.email} onChange={(e) => emailRef.current = e.target.value} required formNoValidate />
                <label htmlFor="role">Role: </label>
                <select name="role" defaultValue={session.user.role} onChange={(e) => roleRef.current = e.target.value} required>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                    <option value="boss">boss</option>
                </select>
                <SubmitButton buttonClass="btn-ok w-40 mr-4 mt-4" buttonTitle="Update" onButtonClick={() => null} submitingButtonTitle="Updating" />
                <button type="button" className="btn-cancel w-40 mr-4 mt-4" onClick={() => formRef.current?.reset()}>Reset</button>
            </form>

            <form action={ async (formData) => {
                        const result = await deleteUser(formData);
                        if (result?.error && result?.message) {
                            toast.error(result.message);
                        }
                        else if (result?.message) {
                            toast.success(result.message);
                            await signOut({
                                redirect: true,
                                callbackUrl: "/",
                            });
                        }
                    }
                }>
                <input name="user_uid" type="text" value={session.user.user_uid} hidden readOnly formNoValidate />
                <SubmitButton buttonClass="btn-cancel w-80 mr-4 mt-8" buttonTitle={"Delete " + (emailRef.current ? emailRef.current : session.user.email)} onButtonClick={handleSubmitClick} submitingButtonTitle="Deleting" />
            </form>
        </>
    );
};