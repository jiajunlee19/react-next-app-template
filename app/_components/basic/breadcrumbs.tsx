import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

type Breadcrumb = {
    label: string,
    href: string,
    active?: boolean,
};

export default function Breadcrumbs( { breadcrumbs }: { breadcrumbs: Breadcrumb[] } ) {
    return (
        <nav aria-label="Breadcrumb" className="my-6 mx-[2%] block">
            <ol className="flex items-center">
                {breadcrumbs.map((breadcrumb, index) => (
                    <li key={breadcrumb.href} aria-current={breadcrumb.active}>
                        <Link className={twMerge("no-underline", breadcrumb.active && "underline font-semibold text-purple-500 dark:text-purple-200")} href={breadcrumb.href}>{breadcrumb.label}</Link>
                        {index < breadcrumbs.length -1 ?
                        <span className="mx-3 inline-block">/</span>
                         : null}
                    </li>
                ))}
            </ol>
        </nav>
    );
};