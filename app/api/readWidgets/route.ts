import { NextResponse } from "next/server";
import { readAllWidgetService } from "@/app/_services/widget";
import { returnResponseOnError } from "@/app/_libs/response_handler";
import { apiAnalytics } from '@/app/_libs/apiAnalytics';

async function handler() {

    const response = await readAllWidgetService();

    if (!(response.success)) {
        return returnResponseOnError(response);
    }

    return NextResponse.json({ response }, { status: 200 })
};

export const GET = apiAnalytics(handler);