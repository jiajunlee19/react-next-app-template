import { deleteBoxType, readBoxTypeTotalPage, readBoxTypeByPage } from "@/app/_actions/box_type";
import Pagination from "@/app/_components/basic/pagination";
import TableSkeleton from "@/app/_components/basic/skeletons";
import DataTable from "@/app/_components/data_table";
import { type TReadBoxTypeSchema } from '@/app/_libs/zod_server';
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Box Type',
    description: 'Developed by jiajunlee',
};

export default async function BoxType({ searchParams }: { searchParams?: { itemsPerPage?: string, currentPage?: string } }) {

  const itemsPerPage = Number(searchParams?.itemsPerPage) || 10;
  const currentPage = Number(searchParams?.currentPage) || 1;
  const totalPage = await readBoxTypeTotalPage(itemsPerPage);
  
  const pageTitle = 'Manage Box Type';

  const createButtonTitle = 'Create New Box Type';

  const readAction = readBoxTypeByPage;

  const columnListDisplay: (keyof TReadBoxTypeSchema)[] = ['box_type_uid', 'box_part_number', 'box_max_tray'];
  
  const primaryKey: (keyof TReadBoxTypeSchema) = 'box_type_uid';

  // "[placeholder-id]" will be replaced by "id" for each row in DataTable
  const hrefUpdate = "/box_type/[placeholder-id]/update";

  const deleteAction = deleteBoxType;

  return (
    <>
        <h1>{pageTitle}</h1>
        <Link className="no-underline text-white dark:text-emerald-400 hover:text-white hover:dark:text-emerald-400" href="/box_type/create">
            <button className="btn-primary w-min">
                {createButtonTitle}
            </button>
        </Link>
        <Suspense fallback={<TableSkeleton columnCount={3} rowCount={10} />}>
            <DataTable itemsPerPage={itemsPerPage} currentPage={currentPage} readAction={readAction} columnListDisplay={columnListDisplay} primaryKey={primaryKey} hrefUpdate={hrefUpdate} deleteAction={deleteAction} />
        </Suspense>
        <Pagination totalPage={totalPage} />
    </>
  )
}
