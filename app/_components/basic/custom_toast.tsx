import { ToastBar, Toaster, toast } from "react-hot-toast";

export function CustomToast () {
    return (
        <Toaster position="bottom-right" toastOptions={{ duration: 10000 }}>
            {(t) => {
                return (
                    <div onClick={() => toast.dismiss(t.id)}>
                        <ToastBar toast={t} />
                    </div>
                )
            }}
        </Toaster>
    )
};