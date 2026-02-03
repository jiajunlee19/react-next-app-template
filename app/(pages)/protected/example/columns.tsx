"use client"

import { TrashIcon } from "@heroicons/react/24/outline";
import { deleteExample } from "@/app/_actions/example";
import TableActionButton from "@/app/_components/basic/button_table_action";
import UpdateButton from "@/app/_components/basic/button_update";
import { TReadExampleSchema } from "@/app/_libs/zod_server";
import { createColumnHelper } from "@tanstack/react-table";

// "[placeholder-id]" will be replaced by "id" for each row in DataTable
const hrefUpdate = "/protected/example/[example_uid]/update";

const deleteAction = deleteExample;

const confirmMsg = 'Are you sure to delete this item?';

const columnHelper = createColumnHelper<TReadExampleSchema>();

export const columns = [
    columnHelper.accessor("example_uid", {
        id: "example_uid",
        header: "example_uid",
        footer: "example_uid",
        meta: {
            example: "text",
        },
    }),
    columnHelper.accessor("example", {
        id: "example",
        header: "example",
        footer: "example",
        meta: {
            example: "text",
        },
    }),
    columnHelper.accessor("example_created_dt", {
        id: "example_created_dt",
        header: "example_created_dt",
        footer: "example_created_dt",
        meta: {
            example: "date",
        },
        cell: ({ cell }) => cell.getValue()?.toLocaleString(),
    }),
    columnHelper.accessor("example_updated_dt", {
        id: "example_updated_dt",
        header: "example_updated_dt",
        footer: "example_updated_dt",
        meta: {
            example: "date",
        },
        cell: ({ cell }) => cell.getValue()?.toLocaleString(),
    }),
    columnHelper.display({
        id: "action",
        header: "action",
        footer: "action",
        cell: ({ row }) => (
            <div className="flex gap-1 justify-center align-middle">
                {!!hrefUpdate && <UpdateButton href={hrefUpdate.replace("[example_uid]", row.original.example_uid as string)} />}
                {!!deleteAction && <TableActionButton id={row.original.example_uid as string} action={deleteAction} redirectLink="/protected/example" icon={<TrashIcon className="h-5" />} confirmMsg={confirmMsg} />}
            </div>
        ),
    }),
];