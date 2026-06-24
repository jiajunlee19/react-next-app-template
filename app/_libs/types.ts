import { links, projects, skills, experiences } from "@/app/_libs/data";

export type TSectionName = (typeof links)[number]["name"];
export type TProject = (typeof projects)[number];
export type TSkill = (typeof skills)[number];
export type TExperience = (typeof experiences)[number];


export type TFormMode = "create" | "update" | null;

export type TRole = "user" | "admin" | "boss";

export type TRowData = {
    [key: string]: string | number | Date | null,
};

export type TInputType = {
    [key: string]: "number" | "select" | "text" | "password" | "dynamic" | "hidden" | "readonly"
}

export type State = {
    error?: {
        [key: string]: string[] | undefined
    },
    message: string,
    data?: {
        [key: string]: string
    },
};

export type StatePromise = Promise<State>;

type KnownReason = "Unauthenticated" | "Access Denied" | "Too Many Requests" | "Invalid Input" | "Invalid Output" | "Unexpected Error";

export type ErrorResponse = {
    success: false,
    message: string,
    reason: KnownReason,
    error?: {
        [key: string]: string[] | undefined
    },
    data?: {
        [key: string]: string
    },
};

export type SuccessResponse<T> = {
    success: true,
    message: string,
    data: T,
};

export type ServerResponse<T> = ErrorResponse | SuccessResponse<T>;