"use client"

import UpdateButton from "@/app/_components/basic/button_update";
import { TRowData } from "@/app/_libs/types";
import { TReadUserWithoutPassSchema } from "@/app/_libs/zod_auth";
import { createColumnHelper } from "@tanstack/react-table";

// "[placeholder-id]" will be replaced by "id" for each row in DataTable
const hrefUpdate = "/protected/auth/user/[user_uid]/updateRole";

const columnHelper = createColumnHelper<TRowData | TReadUserWithoutPassSchema>();

export const columns = [
    columnHelper.accessor("user_uid", {
        id: "user_uid",
        header: "user_uid",
        footer: "user_uid",
        meta: {
            type: "text",
        },
    }),
    columnHelper.accessor("username", {
        id: "username",
        header: "username",
        footer: "username",
        meta: {
            type: "text",
        },
    }),
    columnHelper.accessor("role", {
        id: "role",
        header: "role",
        footer: "role",
        meta: {
            type: "text",
        },
    }),
    columnHelper.accessor("user_created_dt", {
        id: "user_created_dt",
        header: "user_created_dt",
        footer: "user_created_dt",
        meta: {
            example: "date",
        },
        cell: ({ cell }) => cell.getValue()?.toLocaleString(),
    }),
    columnHelper.accessor("user_updated_dt", {
        id: "user_updated_dt",
        header: "user_updated_dt",
        footer: "user_updated_dt",
        meta: {
            example: "date",
        },
        cell: ({ cell }) => cell.getValue()?.toLocaleString(),
    }),
    columnHelper.accessor("user_updated_by", {
        id: "user_updated_by",
        header: "user_updated_by",
        footer: "user_updated_by",
        meta: {
            example: "text",
        },
    }),
    columnHelper.display({
        id: "action",
        header: "action",
        footer: "action",
        cell: ({ row }) => (
            <div className="flex gap-1 justify-center align-middle">
                {!!hrefUpdate && <UpdateButton href={hrefUpdate.replace("[user_uid]", row.original.user_uid as string)} />}
            </div>
        ),
    }),

];