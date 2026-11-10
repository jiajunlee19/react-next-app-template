import { parsedEnv } from "./zod_env";

export type TDeniedInfo = {
    username?: string,
    requestedPath?: string,
    owners?: string [],
    viewers?: string [],
};

const SEPARATOR = ".";
const encoder = new TextEncoder();

function importKey() {
    return crypto.subtle.importKey(
        "raw",
        encoder.encode(parsedEnv.NEXTAUTH_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
};

function toBase64Url(bytes: Uint8Array) {
    return Buffer.from(bytes).toString("base64url");
};

async function signPayload(payload: string) {
    const signature = await crypto.subtle.sign("HMAC", await importKey(), encoder.encode(payload));
    return toBase64Url(new Uint8Array(signature));
};

function timingSafeEqual(a: string, b: string) {
    if (a.length !== b.length) return false;

    let difference = 0;
    for (let i = 0; i < a.length; i++) {
        difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return difference === 0;
};

export async function signDeniedInfo(info: TDeniedInfo) {
    const payload = Buffer.from(JSON.stringify(info)).toString("base64url");
    return `${payload}${SEPARATOR}${await signPayload(payload)}`;
};

export async function verifyDeniedInfo(token: string | undefined | null): Promise<TDeniedInfo | null> {
    if (!token) {
        return null;
    }

    const separatorIndex = token.lastIndexOf(SEPARATOR);
    if (separatorIndex <= 0) {
        return null;
    }

    const payload = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + 1);

    if (!timingSafeEqual(await signPayload(payload), signature)) {
        return null;
    }

    try {
        const decoded: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());

        if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
            return null;
        }

        return decoded as TDeniedInfo;
    } catch {
        return null;
    }
};