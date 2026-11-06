import Page404 from "@/app/_components/page_404";
import { verifyDeniedInfo } from "@/app/_libs/denied_info";

export default async function DeniedPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {

    const infoParams = (await searchParams).info;
    const info = await verifyDeniedInfo(typeof infoParams === "string" ? infoParams : null);
   
    let errMessage = "Access Denied.";

    if (info && "viewers" in info && "requestedPath" in info && "owners" in info) {
        errMessage += ` You are not part of the viewers (${info.viewers}). Kindly contact owners (${info.owners}) to get access for ${info.requestedPath}.`
    }

    return (
        <Page404 errMessage={errMessage} />
    );
};