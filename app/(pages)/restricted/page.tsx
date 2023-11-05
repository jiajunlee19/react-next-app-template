import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Template App - Restricted',
    description: 'Developed by jiajunlee',
};

export default function RestrictedPage() {
    return (
        <h1>This is a restricted page!</h1>
    );
};