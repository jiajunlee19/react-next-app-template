import Link from "next/link";

export default function deniedPage() {
    return (
        <div className="h-[100vh] align-middle flex flex-column items-center justify-center gap-4">
            <span className="font-semibold">404</span>
            <span>|</span>
            <span className="font-semibold" >Access Denied</span>
        </div>
    );
};