import { readBoxType, createBoxType, updateBoxType, deleteBoxType, readBoxTypeTotalPage, readBoxTypeByPage } from "@/app/_actions/box_type";
import Pagination from "@/app/_components/basic/pagination";
import Main from "@/app/_components/main";
import { type TInputType, type TRowData } from '@/app/_libs/types';
import { type TReadBoxTypeSchema } from '@/app/_libs/zod_server';
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Box Type',
    description: 'Developed by jiajunlee',
};

export default async function BoxType({ searchParams }: { searchParams?: { itemsPerPage?: string, currentPage?: string } }) {

  const itemsPerPage = Number(searchParams?.itemsPerPage) || 10;
  const currentPage = Number(searchParams?.currentPage) || 1;
  const totalPage = await readBoxTypeTotalPage(itemsPerPage);
  
  const pageTitle = 'Manage Box Type';

  const fetchedData: TReadBoxTypeSchema[] = await readBoxTypeByPage(itemsPerPage, currentPage);

  const inputTypeCreate: TInputType = {
    'box_part_number': 'text',
    'box_max_tray': 'number',
  };

  const inputTypeUpdate: TInputType = {
    'box_type_uid': 'readonly',
    'box_part_number': 'readonly',
    'box_max_tray': 'number',
  };

  const createButtonTitle = 'Create New Box Type';

  const createFormTitle = 'Create New Box Type';

  const updateFormTitle = 'Update Box Type';

  const columnListDisplay: (keyof TReadBoxTypeSchema)[] = ['box_type_uid', 'box_part_number', 'box_max_tray'];
  
  const primaryKey: (keyof TReadBoxTypeSchema) = 'box_type_uid';

  const selectOptionData: TRowData[] = [];
  const selectPrimaryKey = '';
  const selectPrimaryKeyList: string[] = [];

  const createAction = createBoxType;
  const updateAction = updateBoxType;
  const deleteAction = deleteBoxType;

  return (
    <>
      <h1>{pageTitle}</h1>
      <Main fetchedData={fetchedData} createButtonTitle={createButtonTitle} columnListDisplay={columnListDisplay} primaryKey={primaryKey} deleteAction={deleteAction} />
      <Pagination totalPage={totalPage} />
    </>
  )
}
