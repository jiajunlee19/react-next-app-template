// Ref: https://next-auth.js.org/configuration/nextjs#advanced-usage
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { parsedEnv } from "@/app/_libs/zod_env";
import { checkWidgetAccess } from "@/app/_libs/widgets";

export default withAuth(
    // `withAuth` augments your `Request` with the user's token.
    function middleware(request: NextRequestWithAuth) {

        const { hasWidgetOwnerAccess, hasWidgetViewAccess, owners, viewers } = checkWidgetAccess(request.nextUrl.pathname, request.nextauth.token?.username, request.nextauth.token?.role);

        if (!hasWidgetViewAccess) {
            const deniedUrl = new URL("/denied", request.url);
            const info = {
                username: request.nextauth.token?.username,
                requestedPath: request.nextUrl.pathname,
                owners,
                viewers,
            };
            deniedUrl.searchParams.set("info", Buffer.from(JSON.stringify(info)).toString('base64'));
            return NextResponse.redirect(deniedUrl);
        }

        if (request.nextUrl.pathname.startsWith("/authenticated")
            && !request.nextauth.token)
        {
            return NextResponse.rewrite(
                new URL("/denied", request.url)
            )
        }

        if (request.nextUrl.pathname.startsWith("/protected")
            && request.nextauth.token?.role !== "admin"
            && request.nextauth.token?.role !== "boss")
        {
            return NextResponse.rewrite(
                new URL("/denied", request.url)
            )
        }

        if (request.nextUrl.pathname.startsWith("/restricted")
            && request.nextauth.token?.role !== "boss") {
            return NextResponse.rewrite(
                new URL("/denied", request.url)
            )
        }
    },
    {
        secret: parsedEnv.NEXTAUTH_SECRET,
        callbacks: {
            // authorized: ({ token }) => !!token,
            authorized: () => true,
        },
    }
)

// Applies next-auth only to matching routes - can be regex
// Ref: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = { matcher: ["/authenticated/:path*", "/protected/:path*", "/restricted/:path*"] }