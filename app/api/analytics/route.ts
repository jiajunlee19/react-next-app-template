import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { pgSqlConfig, msSqlConfig } from '@/app/_libs/sql_config';
import { parsedEnv } from '@/app/_libs/zod_env';
import sql from 'mssql';
import { rateLimitByIP } from '@/app/_libs/rate_limit';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/_libs/nextAuth_options';
import { createAnalyticsSchema } from '@/app/_libs/zod_server';
import { v5 as uuidv5 } from 'uuid';

const isDev = process.env.NODE_ENV === "development"

export async function POST(request: NextRequest) {

    if (isDev) return;

    if (await rateLimitByIP(120, 1000 * 60)) {
        return NextResponse.json({ error: 'Too many request' }, { status: 429 });
    }

    const session = await getServerSession(options);
    const user_uid = session?.user?.user_uid ?? null;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { event_name, path, duration_ms } = body as Record<string, unknown>;

    const UUID5_SECRET = uuidv5(parsedEnv.UUID5_NAMESPACE, uuidv5.DNS);
    const now = Date.now();
    const parsedBody = createAnalyticsSchema.safeParse({
        event_uid: typeof event_name === "string" ? uuidv5(event_name + now.toString(), UUID5_SECRET) : undefined,
        event_name: event_name,
        duration_ms: typeof duration_ms === "number" ? duration_ms : 0,
        path: path,
        event_created_dt: now,
        event_created_by: user_uid,
    });
    if (!parsedBody.success) {
        return NextResponse.json(
            { error: parsedBody.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    try {
        if (parsedEnv.DB_TYPE === 'PG') {
            const pool = new Pool(pgSqlConfig);
            await pool.query(
                `INSERT INTO "jiajunleeWeb"."analytics" (event_uid, event_name, duration_ms, path, event_created_dt, event_created_by)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [parsedBody.data.event_uid, parsedBody.data.event_name, parsedBody.data.duration_ms, parsedBody.data.path, parsedBody.data.event_created_dt, parsedBody.data.event_created_by]
            );
            await pool.end();
        } else {
            const pool = await sql.connect(msSqlConfig);
            await pool.request()
                .input('event_uid', sql.UniqueIdentifier, parsedBody.data.event_uid)
                .input('event_name', sql.VarChar, parsedBody.data.event_name)
                .input('duration_ms', sql.Int, parsedBody.data.duration_ms)
                .input('path', sql.VarChar, parsedBody.data.path)
                .input('event_created_dt', sql.DateTime, parsedBody.data.event_created_dt)
                .input('event_created_by', sql.UniqueIdentifier, parsedBody.data.event_created_by)
                .query`INSERT INTO [jiajunleeWeb].[analytics] (event_uid, event_name, duration_ms, path, event_created_dt, event_created_by)
                        VALUES (@event_uid, @event_name, @duration_ms, @path, @event_created_dt, @event_created_by)`
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error('Analytics insert error: ', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}