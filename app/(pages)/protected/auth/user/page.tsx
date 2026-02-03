
import { getServerSession } from "next-auth/next";
import { options } from "@/app/_libs/nextAuth_options";
import { redirect } from "next/navigation";
import { readUserTotalPageAdmin, readUserByPageAdmin } from "@/app/_actions/auth";
import Pagination from "@/app/_components/basic/pagination";
import TableSkeleton from "@/app/_components/basic/skeletons";
import DataTable from "@/app/_components/data_table";
import { columns } from "@/app/(pages)/protected/auth/user/columns";
import { Suspense } from "react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'User',
    description: 'Developed by jiajunlee',
};

export default async function User(
    props: { searchParams?: Promise<{ itemsPerPage?: string, currentPage?: string, query?: string }> }
) {

    const session = await getServerSession(options);

    if (!session || session.user.role !== 'boss') {
        redirect("/denied");
    }

    const searchParams = await props.searchParams;

    const itemsPerPage = Number(searchParams?.itemsPerPage) || 10;
    const currentPage = Number(searchParams?.currentPage) || 1;
    const query = searchParams?.query || undefined;

    const totalPage = await readUserTotalPageAdmin(itemsPerPage, query);

    const pageTitle = 'Manage User';

    const readAction = readUserByPageAdmin;

    return (
      <>
          <h1>{pageTitle}</h1>
          <Suspense fallback={<TableSkeleton columnCount={4} rowCount={10} />}>
              <DataTable itemsPerPage={itemsPerPage} currentPage={currentPage} query={query} readAction={readAction} columns={columns} />
          </Suspense>
          <Pagination totalPage={totalPage} />
      </>
    )
}
