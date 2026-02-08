"use client"

import Page404 from "@/app/_components/page_404";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DeniedPage() {

    const searchParams = useSearchParams();
    const [info, setInfo] = useState<{
        username?: string,
        requestedPath?: string,
        owners?: string[],
        viewers?: string[],
    }>({});

    useEffect(() => {
        const infoParams = searchParams.get("info");
        if (infoParams) {
            const decoded = JSON.parse(Buffer.from(infoParams, 'base64').toString());
            setInfo(decoded);
        } else {
            setInfo({});
        }
    }, [searchParams])

    let errMessage = "Access Denied.";

    if (info && "viewers" in info && "requestedPath" in info && "owners" in info) {
        errMessage += ` You are not part of the viewers (${info.viewers}). Kindly contact owners (${info.owners}) to get access for ${info.requestedPath}.`
    }

    return (
        <Page404 errMessage={errMessage} />
    );
};