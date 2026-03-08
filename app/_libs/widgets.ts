import { type TRole } from "@/app/_libs/types";
import { type TCreateWidgetSchema } from "@/app/_libs/zod_server";

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

    const widget = widgets.find((widget) => pathname.startsWith(widget.widget_href));

    // Grant to everyone if its not a widget
    if (!widget) return {
        hasWidgetOwnerAccess: false,
        hasWidgetViewAccess: true,
        owners: [],
        viewers: ["everyone"],
    };

    // If no widget viewers defined, default to everyone
    let viewers: string[];
    if (!widget.widget_viewers || widget.widget_viewers.length <= 0) {
        viewers = ["everyone"];
    }
    else {
        viewers = widget.widget_viewers.split(",");
    }

    // If no widget owners defined, default to viewers
    let owners: string[];
    if (!widget.widget_owners || widget.widget_owners.length <= 0) {
        owners = viewers;
    }
    else {
        owners = widget.widget_owners.split(",");
    }

    // Widget owners
    const resCheckIfUserInOwnerGroups = await fetch(`${base_url}/api/checkIfUserInGroups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groups: owners, username: username }),
    });
    const checkIfUserInOwnerGroups = await resCheckIfUserInOwnerGroups.json();
    const isUserInOwnerGroups = "isUserInGroups" in checkIfUserInOwnerGroups ? checkIfUserInOwnerGroups.isUserInGroups : false;
    if (owners.includes("everyone") || owners.includes(username) || isUserInOwnerGroups) {
        return {
            hasWidgetOwnerAccess: true,
            hasWidgetViewAccess: true,
            owners: owners,
            viewers: viewers,
        }
    }

    // Widget viewers
    const resCheckIfUserInViewerGroups = await fetch(`${base_url}/api/checkIfUserInGroups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groups: viewers, username: username }),
    });
    const checkIfUserInViewerGroups = await resCheckIfUserInViewerGroups.json();
    const isUserInViewerGroups = "isUserInGroups" in checkIfUserInViewerGroups ? checkIfUserInViewerGroups.isUserInGroups : false;
    if (viewers.includes("everyone") || viewers.includes(username) || isUserInViewerGroups) {
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