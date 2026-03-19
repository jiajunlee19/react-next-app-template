"use client"

import { TrashIcon } from "@heroicons/react/24/outline";
import { deleteWidget } from "@/app/_actions/widget";
import TableActionButton from "@/app/_components/basic/button_table_action";
import UpdateButton from "@/app/_components/basic/button_update";
import { TReadWidgetSchema } from "@/app/_libs/zod_server";
import { createColumnHelper } from "@tanstack/react-table";

// "[placeholder-id]" will be replaced by "id" for each row in DataTable
const hrefUpdate = "/authenticated/widget/[widget_uid]/update";

const deleteAction = deleteWidget;

const confirmMsg = 'Are you sure to delete this item?';

const columnHelper = createColumnHelper<TReadWidgetSchema>();

export const columns = [
    columnHelper.accessor("widget_uid", {
        id: "widget_uid",
        header: "widget_uid",
        footer: "widget_uid",
        meta: {
            widget: "text",
        },
    }),
    columnHelper.accessor("widget_name", {
        id: "widget_name",
        header: "widget_name",
        footer: "widget_name",
        meta: {
            widget: "text",
        },
    }),
    columnHelper.accessor("widget_description", {
        id: "widget_description",
        header: "widget_description",
        footer: "widget_description",
        meta: {
            widget: "text",
        },
    }),
    columnHelper.accessor("widget_group", {
        id: "widget_group",
        header: "widget_group",
        footer: "widget_group",
        meta: {
            widget: "text",
        },
    }),
    columnHelper.accessor("widget_href", {
        id: "widget_href",
        header: "widget_href",
        footer: "widget_href",
        meta: {
            widget: "text",
        },
    }),
    columnHelper.accessor("widget_tabs", {
        id: "widget_tabs",
        header: "widget_tabs",
        footer: "widget_tabs",
        meta: {
            widget: "text",
        },
        cell: ({ getValue }) => {
            const tabs = getValue() as {name: string, href: string}[];
            if (!Array.isArray(tabs)) return null;
            return tabs.map(tab => tab.name).join(', ');
        },
    }),
    columnHelper.accessor("widget_owners", {
        id: "widget_owners",
        header: "widget_owners",
        footer: "widget_owners",
        meta: {
            widget: "text",
        },
        cell: ({ getValue }) => {
            const owners = getValue() as string[];
            if (!Array.isArray(owners)) return null;
            return owners.join(', ');
        },
    }),
    columnHelper.accessor("widget_viewers", {
        id: "widget_viewers",
        header: "widget_viewers",
        footer: "widget_viewers",
        meta: {
            widget: "text",
        },
        cell: ({ getValue }) => {
            const viewers = getValue() as string[];
            if (!Array.isArray(viewers)) return null;
            return viewers.join(', ');
        },
    }),
    columnHelper.accessor("widget_created_dt", {
        id: "widget_created_dt",
        header: "widget_created_dt",
        footer: "widget_created_dt",
        meta: {
            widget: "date",
        },
        cell: ({ cell }) => cell.getValue()?.toLocaleString(),
    }),
    columnHelper.accessor("widget_updated_dt", {
        id: "widget_updated_dt",
        header: "widget_updated_dt",
        footer: "widget_updated_dt",
        meta: {
            widget: "date",
        },
        cell: ({ cell }) => cell.getValue()?.toLocaleString(),
    }),
    columnHelper.accessor("widget_updated_by", {
        id: "widget_updated_by",
        header: "widget_updated_by",
        footer: "widget_updated_by",
        meta: {
            widget: "text",
        },
    }),
    columnHelper.display({
        id: "action",
        header: "action",
        footer: "action",
        cell: ({ row }) => (
            <div className="flex gap-1 justify-center align-middle">
                {!!hrefUpdate && <UpdateButton href={hrefUpdate.replace("[widget_uid]", row.original.widget_uid as string)} />}
                {!!deleteAction && <TableActionButton id={row.original.widget_uid as string} action={deleteAction} redirectLink="/authenticated/widget" icon={<TrashIcon className="h-5" />} confirmMsg={confirmMsg} />}
            </div>
        ),
    }),
];