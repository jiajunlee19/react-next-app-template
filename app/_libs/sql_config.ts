import { envSchema } from "@/app/_libs/zod_env";

const parsedEnv = envSchema.parse(process.env);

export const msSqlConfig = {
  user: parsedEnv.DB_USER,
  password: parsedEnv.DB_PASSWORD,
  database: parsedEnv.DB_DATABASE,
  server: parsedEnv.DB_HOST,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: true // change to true for local dev / self-signed certs
  }
}

export const pgSqlConfig = {
  user: parsedEnv.DB_USER,
  password: parsedEnv.DB_PASSWORD,
  database: parsedEnv.DB_DATABASE,
  host: parsedEnv.DB_HOST,
  port: 5432, // Postgres default
  ssl: {
    rejectUnauthorized: false, // required for Vercel Postgres
  },
  max: 10,
  idleTimeoutMillis: 30000,
};