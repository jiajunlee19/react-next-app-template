'use server'

import { StatePromise, type State } from '@/app/_libs/types';
import { readWidgetTotalPageService, readWidgetByPageService, readAllWidgetService, readWidgetUidService, readWidgetByUidService, createWidgetService, updateWidgetService, deleteWidgetService } from "@/app/_services/widget";
import { redirectOnError, returnStateOnError } from "@/app/_libs/response_handler";

export async function readWidgetTotalPage(itemsPerPage: number | unknown, query?: string | unknown) {

    const response = await readWidgetTotalPageService(itemsPerPage, query);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function readWidgetByPage(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown) {

    const response = await readWidgetByPageService(itemsPerPage, currentPage, query);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function readAllWidget() {

    const response = await readAllWidgetService();

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function readWidgetUid(widget_href: string | unknown) {

    const response = await readWidgetUidService(widget_href);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function readWidgetByUid(widget_uid: string) {

    const response = await readWidgetByUidService(widget_uid);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function createWidget(prevState: State | unknown, formData: FormData | unknown): StatePromise {

    const response = await createWidgetService(formData);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};


export async function updateWidget(prevState: State | unknown, formData: FormData | unknown): StatePromise {

    const response = await updateWidgetService(formData);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};


export async function deleteWidget(widget_uid: string): StatePromise {

    const response = await deleteWidgetService(widget_uid);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};