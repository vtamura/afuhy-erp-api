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

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'qa', 'test', 'production'])
        .default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('error'),
    PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().default('/api/v2'),
    API_ACCESS: z.string().optional(),
    DB_DIALECT: z.enum(['mysql']).default('mysql'),
    DB_HOST: z.string().default('127.0.0.1'),
    DB_PORT: z.coerce.number().int().positive().default(3306),
    DB_USER: z.string().default('root'),
    DB_PASSWORD: z.string().default('root'),
    DB_NAME: z.string().default('qa_solutions'),
    DB_BACCESS_SCHEMA: z.string().default('baccess'),
    AWS_REGION: z.string().default('sa-east-1'),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_BUCKET_ATTACHMENTS: z.string().optional(),
    AWS_S3_DOWNLOAD_URL_EXPIRES_IN: z.coerce
        .number()
        .int()
        .positive()
        .default(900),
    DB_LOG_SQL: z
        .union([z.literal('true'), z.literal('false')])
        .default('false')
        .transform((value) => value === 'true'),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)
