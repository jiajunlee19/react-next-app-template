import { readWidgetTotalPage, readWidgetByPage } from "@/app/_actions/widget";
import Pagination from "@/app/_components/basic/pagination";
import TableSkeleton from "@/app/_components/basic/skeletons";
import DataTable from "@/app/_components/data_table";
import { columns } from "@/app/(pages)/authenticated/widget/columns";
import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/_libs/nextAuth_options";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Widget',
    description: 'Developed by jiajunlee',
};

export default async function Widget(
    props: { searchParams?: Promise<{ itemsPerPage?: string, currentPage?: string, query?: string }> }
) {
    const searchParams = await props.searchParams;

    const itemsPerPage = Number(searchParams?.itemsPerPage) || 10;
    const currentPage = Number(searchParams?.currentPage) || 1;
    const query = searchParams?.query || undefined;

    const totalPage = await readWidgetTotalPage(itemsPerPage, query);

    const pageTitle = 'Manage Widget';

    const createButtonTitle = 'Create New Widget';

    const readAction = readWidgetByPage;
    
    const session = await getServerSession(options);

    return (
        <>
            <h1>{pageTitle}</h1>
            {(session?.user.role === "admin" || session?.user.role === "boss") && (
                <Link className="btn btn-primary w-min no-underline" href="/protected/widget/create">
                    {createButtonTitle}
                </Link>
            )}

            <Suspense fallback={<TableSkeleton columnCount={4} rowCount={10} />}>
                <DataTable itemsPerPage={itemsPerPage} currentPage={currentPage} query={query} readAction={readAction} columns={columns} />
            </Suspense>
            <Pagination totalPage={totalPage} />
        </>
    )
};
