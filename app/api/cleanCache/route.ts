import { NextResponse } from "next/server";
import { revalidateSnowflakeCache } from "@/app/_actions/example";

export async function POST() {
    try {
        const result = await revalidateSnowflakeCache();

        if (result && "error" in result) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json(
            { success: false, error: (err as Error).message }, { status: 500 }
        );
    }
};