'use client'

import { useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import SubmitButton from "@/app/_components/basic/button_submit";
import { toast } from "react-hot-toast";
import { redirect, useSearchParams } from "next/navigation";

export default function SignInComponent() {

    const { data: session, status } = useSession();

    if (session) {
        redirect("/");
    }

    const searchParams = useSearchParams();
    const callBackUrl = searchParams.get('callbackUrl') || '/';

    const formRef = useRef<HTMLFormElement>(null);
    const usernameRef = useRef("");
    const passwordRef = useRef("");

    // Auto-trigger Azure AD sign-in when page loads and user if not authenticated
    // useEffect(() => {
    //     if (status === "unauthenticated") {
    //         signIn("azure-ad", { callbackUr: callBackUrl });
    //     }
    // }, [status, callBackUrl])

    const handleSubmitClick = (e: React.MouseEvent<HTMLButtonElement>) => {

        const confirmMsg = "Are you sure to sign in?"

        //if any button other than submit is clicked, preventDefault submit routing!
        if (!window.confirm(confirmMsg)) {
            e.preventDefault();
            return;
        };

    };

    const handleAzureSignIn = async () => {
        if (!window.confirm("Are you sure to sign in with Azure AD?")) return;
        await signIn("azure-ad", { callbackUrl: callBackUrl });
    }

    // Show loading state while redirecting to Azure AD
    if (status === "unauthenticated" || status === "loading") {
        return (
            <div className="flex flex-col items-center gap-4 mt-8">
                <p className="text-gray-500 dark:text-gray-400">One moment, signing you in ...</p>
            </div>
        );
    }

    return (
        <>
            <h1>Sign In</h1>

            <button type="button" className="btn-ok mt-4" onClick={handleAzureSignIn}>
                Sign In with Azure AD
            </button>

            <div className="flex items-center gap-2 my-6">
                <hr className="flex-1 border-gray-300 dark:border-gray-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">or sign in with credentials</span>
                <hr className="flex-1 border-gray-300 dark:border-gray-500" />
            </div>

            <form ref={formRef} action={ async (formData) => {
                        const result = await signIn("LDAP", {
                            username: usernameRef.current,
                            password: passwordRef.current,
                            redirect: false,
                            callbackUrl: callBackUrl,
                        });
                        
                        if (result?.error) {
                            toast.error(result.error);
                        }
                        
                        formRef.current?.reset();
                    }
                }>
                <label htmlFor="username">Username: </label>
                <input name="username" type="text" placeholder="Enter your username" onChange={(e) => usernameRef.current = e.target.value} required formNoValidate />
                <label htmlFor="password">Password: </label>
                <input name="password" type="password" placeholder="Enter your password" onChange={(e) => passwordRef.current = e.target.value} autoComplete="off" required formNoValidate />
                <SubmitButton buttonClass="btn-ok w-40 mr-4 mt-4" buttonTitle="Sign In" onButtonClick={handleSubmitClick} submitingButtonTitle="Signing In" />
                <button type="button" className="btn-cancel w-40 mr-4 mt-4" onClick={() => formRef.current?.reset()}>reset</button>
            </form>
        </>
    );
};