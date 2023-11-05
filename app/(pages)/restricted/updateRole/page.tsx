import type { Metadata } from 'next';
import UpdateRoleComponent from '@/app/(pages)/restricted/updateRole/component';

export const metadata: Metadata = {
    title: 'Template App - Update Role',
    description: 'Developed by jiajunlee',
};

export default function RestrictedPage() {
    return (
       <UpdateRoleComponent />
    );
};