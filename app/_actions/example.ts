'use server'

import { StatePromise, type State } from '@/app/_libs/types';
import { redirectOnError, returnStateOnError } from "@/app/_libs/response_handler";
import { readExampleTotalPageService, readExampleByPageService, readAllExampleService, readExampleUidService, readExampleByIdService, createExampleService, updateExampleService, deleteExampleService } from "@/app/_services/example";

export async function readExampleTotalPage(itemsPerPage: number | unknown, query?: string | unknown) {

    const response = await readExampleTotalPageService(itemsPerPage, query);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function readExampleByPage(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown) {

    const response = await readExampleByPageService(itemsPerPage, currentPage, query);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function readAllExample() {

    const response = await readAllExampleService();

    if (!(response.success)) {
        console.error(response.message);
        return []
    }

    return response.data
};

export async function readExampleUid(example: string | unknown) {

    const response = await readExampleUidService(example);

    if (!(response.success)) {
        console.error(response.message);
        return {}
    }

    return response.data
};

export async function readExampleById(example_uid: string) {

    const response = await readExampleByIdService(example_uid);

    if (!(response.success)) {
        console.error(response.message);
        return {}
    }

    return response.data
};

export async function createExample(prevState: State | unknown, formData: FormData | unknown): StatePromise {

    const response = await createExampleService(formData);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};

export async function updateExample(prevState: State | unknown, formData: FormData | unknown): StatePromise {

    const response = await updateExampleService(formData);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};

export async function deleteExample(example_uid: string): StatePromise {

    const response = await deleteExampleService(example_uid);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};