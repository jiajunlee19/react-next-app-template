"use client"

import { TrashIcon } from "@heroicons/react/24/outline";
import { deleteType } from "@/app/_actions/type";
import TableActionButton from "@/app/_components/basic/button_table_action";
import UpdateButton from "@/app/_components/basic/button_update";
import { TReadTypeSchema } from "@/app/_libs/zod_server";
import { createColumnHelper } from "@tanstack/react-table";

// "[placeholder-id]" will be replaced by "id" for each row in DataTable
const hrefUpdate = "/protected/type/[type_uid]/update";

const deleteAction = deleteType;

const confirmMsg = 'Are you sure to delete this item?';

const columnHelper = createColumnHelper<TReadTypeSchema>();

export const columns = [
    columnHelper.accessor("type_uid", {
        id: "type_uid",
        header: "type_uid",
        footer: "type_uid",
        meta: {
            type: "text",
        },
    }),
    columnHelper.accessor("type", {
        id: "type",
        header: "type",
        footer: "type",
        meta: {
            type: "text",
        },
    }),
    columnHelper.accessor("type_created_dt", {
        id: "type_created_dt",
        header: "type_created_dt",
        footer: "type_created_dt",
        meta: {
            type: "date",
        },
        cell: ({ cell }) => cell.getValue()?.toLocaleString(),
    }),
    columnHelper.accessor("type_updated_dt", {
        id: "type_updated_dt",
        header: "type_updated_dt",
        footer: "type_updated_dt",
        meta: {
            type: "date",
        },
        cell: ({ cell }) => cell.getValue()?.toLocaleString(),
    }),
    columnHelper.display({
        id: "action",
        header: "action",
        footer: "action",
        cell: ({ row }) => (
            <div className="flex gap-1 justify-center align-middle">
                {!!hrefUpdate && <UpdateButton href={hrefUpdate.replace("[type_uid]", row.original.type_uid as string)} />}
                {!!deleteAction && <TableActionButton id={row.original.type_uid as string} action={deleteAction} redirectLink="/protected/type" icon={<TrashIcon className="h-5" />} confirmMsg={confirmMsg} />}
            </div>
        ),
    }),
];