import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { options } from "@/app/_libs/nextAuth_options";

const isDev = process.env.NODE_ENV === "development"

type RouteHandler = (req: NextRequest) => Promise<NextResponse> | NextResponse;

export function apiAnalytics(handler: RouteHandler) {
    return async (req: NextRequest) => {
        
        if (isDev) return handler(req);

        const start = Date.now();

        const res = await handler(req);

        const tab_uid = crypto.randomUUID();

        const duration_ms = Date.now() - start;

        const session = await getServerSession(options);
        const user_uid = session?.user?.user_uid ?? null;

        const payload = {
            tab_uid: tab_uid,
            event_name: 'API_CALL',
            path: req.url,
            duration_ms,
            user_uid,
        };
        
        void fetch('/api/analytics', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        }).catch((e) => console.error(e));

        return res
    }
};