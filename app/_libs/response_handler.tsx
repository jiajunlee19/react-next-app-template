import { type ErrorResponse } from "@/app/_libs/types";
import { notFound, redirect } from "next/navigation";
import { NextResponse } from "next/server";

export function returnStateOnError(errorResponse: ErrorResponse) {
    switch (errorResponse.reason) {
        case "Unauthenticated":
        case "Access Denied":
        case "Too Many Requests":
        case "Invalid Input":
        case "Invalid Output":
        case "Unexpected Error":
            return {
                success: errorResponse.success,
                error: errorResponse.error,
                message: errorResponse.message,
                data: errorResponse.data,
            }

        default:
            throw new Error(errorResponse.reason satisfies never);
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
    switch (errorResponse.reason) {
        case "Invalid Input":
        case "Invalid Output":
            return NextResponse.json(errorResponse, { status: 400 })

        case "Unauthenticated":
            return NextResponse.json(errorResponse, { status: 401 })

        case "Access Denied":
            return NextResponse.json(errorResponse, { status: 403 })

        case "Too Many Requests":
            return NextResponse.json(errorResponse, { status: 429 })

        case "Unexpected Error":
            return NextResponse.json(errorResponse, { status: 500 })

    default:
        throw new Error(errorResponse.reason satisfies never);
    }
};