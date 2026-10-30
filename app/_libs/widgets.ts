import { type ServerResponse, type TRole } from "@/app/_libs/types";
import { type TReadWidgetSchema, type TCreateWidgetSchema } from "@/app/_libs/zod_server";

export const widgets: TCreateWidgetSchema[] = [
    {
        widget_uid: "BC0C0BBC-FCBE-5D85-8A5C-5F603AECBEB2",
        widget_name: "Example", widget_description: "A demo example", widget_group: "GROUP1", widget_href: "/authenticated/example",
        widget_tabs: JSON.stringify([{name: "tab1", href: "/authenticated/example/tab1"}, {name: "tab2", href: "/authenticated/example/tab2"}]),
        widget_owners: "jiajunlee",
        widget_viewers: "jiajunlee",
        widget_created_dt: new Date(),
        widget_updated_dt: new Date(),
        widget_updated_by: "BC0C0BBC-FCBE-5D85-8A5C-5F603AECBEB2",
    }
];

async function fetchJson(url: string, init?: RequestInit): Promise<unknown | null> {
    try {
        const res = await fetch(url, init);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};

export async function checkWidgetAccess(base_url: string | unknown, pathname: string | unknown, username: string | unknown, role: TRole | unknown) {

    if (typeof base_url !== "string" || typeof pathname !== "string" || typeof username !== "string" || !role) {
        return {
            hasWidgetOwnerAccess: false,
            hasWidgetViewAccess: false,
            owners: [],
            viewers: [],
        }
    }

    // Instance superAdmins own all widgets by default
    if (role === "boss") {
        return {
            hasWidgetOwnerAccess: true,
            hasWidgetViewAccess: true,
            owners: [username],
            viewers: [username],
        }
    }

    // Instance admins can view all widgets by default
    if (role === "admin") {
        return {
            hasWidgetOwnerAccess: false,
            hasWidgetViewAccess: true,
            owners: [username],
            viewers: [username],
        }
    }

    const readWidgetsBody = await fetchJson(`${base_url}/api/readWidgets`);
    const resWidgets = (readWidgetsBody as { response?: ServerResponse<TReadWidgetSchema[]> } | null)?.response;
    const widgets = resWidgets?.success ? resWidgets.data : [];
    const widget = widgets.find((widget) => pathname.startsWith(widget.widget_href ?? ""));

    // Grant to everyone if its not a widget
    if (!widget) return {
        hasWidgetOwnerAccess: false,
        hasWidgetViewAccess: true,
        owners: [],
        viewers: ["everyone"],
    };

    const splitList = (value: string) => value.split(",").map(v => v.trim()).filter(Boolean);

    // If no widget viewers defined, default to everyone
    let viewers: string[];
    if (!widget.widget_viewers || widget.widget_viewers.length <= 0) {
        viewers = ["everyone"];
    }
    else {
        viewers = splitList(widget.widget_viewers);
    }

    // If no widget owners defined, default to viewers
    let owners: string[];
    if (!widget.widget_owners || widget.widget_owners.length <= 0) {
        owners = viewers;
    }
    else {
        owners = splitList(widget.widget_owners);
    }

    // Widget owners
    const checkIfUserInOwnerGroups = await fetchJson(`${base_url}/api/checkIfUserInGroups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groups: owners, username: username }),
    });
    const isUserInOwnerGroups = !!(checkIfUserInOwnerGroups as { isUserInGroups?: boolean } | null)?.isUserInGroups;
    if (owners.includes("everyone") || owners.map(o => o.toLowerCase()).includes(username.toLowerCase()) || isUserInOwnerGroups) {
        return {
            hasWidgetOwnerAccess: true,
            hasWidgetViewAccess: true,
            owners: owners,
            viewers: viewers,
        }
    }

    // Widget viewers
    const checkIfUserInViewerGroups = await fetchJson(`${base_url}/api/checkIfUserInGroups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groups: viewers, username: username }),
    });
    const isUserInViewerGroups = !!(checkIfUserInViewerGroups as { isUserInGroups?: boolean } | null)?.isUserInGroups;
    if (viewers.includes("everyone") || viewers.map(v => v.toLowerCase()).includes(username.toLowerCase()) || isUserInViewerGroups) {
        return {
            hasWidgetOwnerAccess: false,
            hasWidgetViewAccess: true,
            owners: owners,
            viewers: viewers,
        }
    }

    return {
        hasWidgetOwnerAccess: false,
        hasWidgetViewAccess: false,
        owners: owners,
        viewers: viewers,
    }
};