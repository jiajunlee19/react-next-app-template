import { type ErrorResponse } from "@/app/_libs/types";
import { notFound, redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const GENERIC_ERROR_MESSAGE = "An unexpected error occurred, please try again later.";

function redactUnexpected(errorResponse: ErrorResponse): ErrorResponse {
    if (errorResponse.reason !== "Unexpected Error") {
        return errorResponse;
    }

    console.error(errorResponse.message);

    return {
        ...errorResponse,
        message: GENERIC_ERROR_MESSAGE,
    };
};

export function logAndRedact(error: unknown, context: string): string {
    console.error(context, error);
    return GENERIC_ERROR_MESSAGE;
};

export function returnStateOnError(errorResponse: ErrorResponse) {
    const safeResponse = redactUnexpected(errorResponse);

    switch (safeResponse.reason) {
        case "Unauthenticated":
        case "Access Denied":
        case "Too Many Requests":
        case "Invalid Input":
        case "Invalid Output":
        case "Unexpected Error":
            return {
                success: safeResponse.success,
                error: safeResponse.error,
                message: safeResponse.message,
                data: safeResponse.data,
            }

        default:
            throw new Error(safeResponse.reason satisfies never);
    }
};

export function redirectOnError(errorResponse: ErrorResponse) {
    switch (errorResponse.reason) {
        case "Unauthenticated":
        case "Access Denied":
            const encodedInfo = errorResponse.data?.encodedInfo;
            redirect(encodedInfo ? `/denied?info=${encodedInfo}` : "/denied");

        case "Too Many Requests":
            redirect("/tooManyRequests");

        case "Invalid Input":
        case "Invalid Output":
        case "Unexpected Error":
            console.error(errorResponse.message);
            notFound();

        default:
            throw new Error(errorResponse.reason satisfies never);
    }
};

export function returnResponseOnError(errorResponse: ErrorResponse) {
    const safeResponse = redactUnexpected(errorResponse);

    switch (safeResponse.reason) {
        case "Invalid Input":
        case "Invalid Output":
            return NextResponse.json(safeResponse, { status: 400 })

        case "Unauthenticated":
            return NextResponse.json(safeResponse, { status: 401 })

        case "Access Denied":
            return NextResponse.json(safeResponse, { status: 403 })

        case "Too Many Requests":
            return NextResponse.json(safeResponse, { status: 429 })

        case "Unexpected Error":
            return NextResponse.json(safeResponse, { status: 500 })

    default:
        throw new Error(safeResponse.reason satisfies never);
    }
};