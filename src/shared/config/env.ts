import dotenv from 'dotenv'
import path from 'node:path'
import { z } from 'zod'

const nodeEnv = process.env.NODE_ENV ?? 'development'

dotenv.config({
    path: path.resolve(process.cwd(), '.env'),
})

dotenv.config({
    path: path.resolve(process.cwd(), `.env.${nodeEnv}`),
    override: true,
})

function emptyStringToUndefined(value: unknown): unknown {
    return typeof value === 'string' && value.trim() === '' ? undefined : value
}

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'qa', 'test', 'production'])
        .default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('error'),
    PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().default('/api'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    DB_DIALECT: z.enum(['postgres']).default('postgres'),
    DB_HOST: z.string().default('127.0.0.1'),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_USER: z.string().default('postgres'),
    DB_PASSWORD: z.string().default('postgres'),
    DB_NAME: z.string().default('afuhy'),
    ACCESS_TOKEN_SECRET: z.preprocess(
        emptyStringToUndefined,
        z.string().default('change-me-access-token-secret'),
    ),
    ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
    REFRESH_TOKEN_SECRET: z.preprocess(
        emptyStringToUndefined,
        z.string().default('change-me-refresh-token-secret'),
    ),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
    AUTH_COOKIE_DOMAIN: z.preprocess(
        emptyStringToUndefined,
        z.string().optional(),
    ),
    AUTH_COOKIE_SECURE: z
        .union([z.literal('true'), z.literal('false')])
        .default('false')
        .transform((value) => value === 'true'),
    DB_LOG_SQL: z
        .union([z.literal('true'), z.literal('false')])
        .default('false')
        .transform((value) => value === 'true'),
    STRIPE_PUBLISHABLE_KEY: z.string().default(''),
    STRIPE_SECRET_KEY: z.string().default(''),
    STRIPE_WEBHOOK_SECRET: z.string().default(''),
    STRIPE_PRICE_BUSINESS_MONTHLY: z.string().default(''),
    STRIPE_PRICE_EXTRA_USER_MONTHLY: z.string().default(''),
    STRIPE_SUCCESS_URL: z.string().url().default('http://localhost:3000'),
    STRIPE_CANCEL_URL: z.string().url().default('http://localhost:3000'),
    STRIPE_PORTAL_RETURN_URL: z.string().url().default('http://localhost:3000'),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)
