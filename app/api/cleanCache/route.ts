import { NextResponse } from "next/server";
import { revalidateSnowflakeCacheService } from "@/app/_services/example";
import { returnResponseOnError } from "@/app/_libs/response_handler";

export async function POST() {

    const response = await revalidateSnowflakeCacheService();

    if (!(response.success)) {
        return returnResponseOnError(response);
    }

    return NextResponse.json({ response }, { status: 200 });
};