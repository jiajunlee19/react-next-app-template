import SignOutComponent from "@/app/(pages)/auth/signOut/component";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Template App - Sign Out',
    description: 'Developed by jiajunlee',
};

export default function SignOutPage() {
    return <SignOutComponent />
};