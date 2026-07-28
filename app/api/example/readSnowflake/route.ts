import { NextResponse } from 'next/server';
import { readSnowflakeService } from '@/app/_services/example';
import { apiAnalytics } from '@/app/_libs/apiAnalytics';
import { inputValuesSchema } from '@/app/_libs/zod_server';
import { getErrorMessage } from '@/app/_libs/error_handler';

async function handler(req: Request) {
    try {
        const { input_values } = await req.json();
        const parsedInputValues = inputValuesSchema.safeParse(input_values);

        if (!parsedInputValues.success) {
            return NextResponse.json({ message: ["Invalid input values provided."] }, { status: 400 });
        }

        const result = await readSnowflakeService(input_values);

        return NextResponse.json(result, { status: result.success ? 200 : 403 });

    } catch (err: unknown) {
        return NextResponse.json({ message: getErrorMessage(err) }, { status: 500 });
    }
};

export const POST = apiAnalytics(handler);
