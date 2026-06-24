'use server'

import { type TUsernameSchema, type TPasswordSchema } from "@/app/_libs/zod_auth";
import { type StatePromise } from '@/app/_libs/types';
import { readUserTotalPageService, readUserByPageService, readUserTotalPageAdminService, readUserByPageAdminService, readUserByIdService, signInService, signInLDAPService, signInAzureADService, signUpService, updateUserService, deleteUserService, updateRoleService, updateRoleAdminService } from "@/app/_services/auth";
import { redirectOnError, returnStateOnError } from "@/app/_libs/response_handler";

export async function readUserTotalPage(itemsPerPage: number | unknown, query?: string | unknown) {

    const response = await readUserTotalPageService(itemsPerPage, query);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function readUserByPage(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown) {

    const response = await readUserByPageService(itemsPerPage, currentPage, query);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function readUserTotalPageAdmin(itemsPerPage: number | unknown, query?: string | unknown) {

    const response = await readUserTotalPageAdminService(itemsPerPage, query);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function readUserByPageAdmin(itemsPerPage: number | unknown, currentPage: number | unknown, query?: string | unknown) {

    const response = await readUserByPageAdminService(itemsPerPage, currentPage, query);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function readUserById(user_uid: string | unknown) {

    const response = await readUserByIdService(user_uid);

    if (!(response.success)) {
        redirectOnError(response);
        throw new Error("Unexpected error, should redirect.")
    }

    return response.data
};

export async function signIn(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown) {

    const response = await signInService(username, password);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response.data
};

export async function signInLDAP(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown) {

    const response = await signInLDAPService(username, password);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response.data
};

export async function signInAzureAD(username: TUsernameSchema | unknown) {

    const response = await signInAzureADService(username);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response.data
};

export async function signUp(username: TUsernameSchema | unknown, password: TPasswordSchema | unknown): StatePromise {

    const response = await signUpService(username, password);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};

export async function updateUser(formData: FormData | unknown): StatePromise {

    const response = await updateUserService(formData);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};

export async function deleteUser(user_uid: string | unknown): StatePromise {

    const response = await deleteUserService(user_uid);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};

export async function updateRole(formData: FormData | unknown): StatePromise {

    const response = await updateRoleService(formData);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};

export async function updateRoleAdmin(formData: FormData | unknown): StatePromise {

    const response = await updateRoleAdminService(formData);

    if (!(response.success)) {
        return returnStateOnError(response);
    }

    return response
};