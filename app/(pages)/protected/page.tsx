import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Protected',
    description: 'Developed by jiajunlee',
};

export default function ProtectedPage() {
    return (
        <h1>This is a protected page!</h1>
    );
};