import { envSchema } from "@/app/_libs/zod_env";
import snowflake from "snowflake-sdk";

const parsedEnv = envSchema.parse(process.env);

// snowflake.configue({logLevel: 'DEBUG'})

export const snowflakeConfig: snowflake.ConnectionOptions = {
    account: parsedEnv.SNOWFLAKE_ACCOUNT,
    host: parsedEnv.SNOWFLAKE_HOST,
    username: parsedEnv.SNOWFLAKE_USERNAME,
    password: parsedEnv.SNOWFLAKE_PASSWORD,
    warehouse: parsedEnv.SNOWFLAKE_WAREHOUSE,
    authenticator: 'SNOWFLAKE',
    sfRetryMaxLoginRetries: 1,
}

export const snowflakePoolConfig: snowflake.PoolOptions = {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
}

export const snowflakePool = snowflake.createPool(snowflakeConfig, snowflakePoolConfig);