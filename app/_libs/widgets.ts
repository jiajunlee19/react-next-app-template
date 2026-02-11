import { TRole } from "@/app/_libs/types";

type TWidget = {
    name: string,
    description: string,
    group: string,
    href: string,
    tabs: { name: string, href: string }[],
    owners: string[],
    viewers: string[],
};

export const widgets: TWidget[] = [
    {
        name: "Example", description: "A demo example", group: "GROUP1", href: "/authenticated/example",
        tabs: [{name: "tab1", href: "/authenticated/example/tab1"}, {name: "tab2", href: "/authenticated/example/tab2"}],
        owners: ['jiajunlee'],
        viewers: ['jiajunlee'],
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

    const widget = widgets.find((widget) => pathname.startsWith(widget.href));

    // Grant to everyone if its not a widget
    if (!widget) return {
        hasWidgetOwnerAccess: false,
        hasWidgetViewAccess: true,
        owners: [],
        viewers: ["everyone"],
    };

    // If no widget viewers defined, default to everyone
    let viewers: string[];
    if (!widget.viewers || widget.viewers.length <= 0) {
        viewers = ["everyone"];
    }
    else {
        viewers = widget.viewers;
    }

    // If no widget owners defined, default to viewers
    let owners: string[];
    if (!widget.owners || widget.owners.length <= 0) {
        owners = viewers;
    }
    else {
        owners = widget.owners
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
    if (viewers.includes("everone") || viewers.includes(username) || isUserInViewerGroups) {
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