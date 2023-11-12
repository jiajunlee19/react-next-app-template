import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Restricted',
    description: 'Developed by jiajunlee',
};

export default function RestrictedPage() {

    const authNavLinks = [
        { name: "Manage User", href: "/restricted/auth/user" },
        { name: "Update User Role by Email", href: "/restricted/updateRole" },
    ];

    return (
        <>
            <h1>Restricted Page for Boss</h1>
            <h3>Auth</h3>
            <nav>
                {authNavLinks.map((link) => {
                    return (
                        <li key={link.name}>
                            <Link href={link.href}>{link.name}</Link>
                        </li>
                    )
                })}
            </nav>
        </>
    );
};