import type { RedisOptions } from 'bullmq'
import { env } from '../../config/env'

const REDIS_DEFAULT_PORT = 6379
const REDIS_CONNECT_TIMEOUT_MS = 10_000
const REDIS_PRODUCER_MAX_RETRIES = 2

export interface RedisConnectionMetadata {
    host: string
    port: number
    db: number
}

export function createBullMqProducerConnectionOptions(
    redisUrl: string = env.REDIS_URL,
): RedisOptions {
    return {
        ...createBaseConnectionOptions(redisUrl),
        maxRetriesPerRequest: REDIS_PRODUCER_MAX_RETRIES,
    }
}

export function createBullMqWorkerConnectionOptions(
    redisUrl: string = env.REDIS_URL,
): RedisOptions {
    return {
        ...createBaseConnectionOptions(redisUrl),
        maxRetriesPerRequest: null,
        retryStrategy: (times) => Math.min(times * 50, 2_000),
    }
}

export function getRedisConnectionMetadata(
    redisUrl: string = env.REDIS_URL,
): RedisConnectionMetadata {
    const url = parseRedisUrl(redisUrl)

    return {
        host: url.hostname,
        port: parsePort(url),
        db: parseDatabase(url.pathname),
    }
}

function createBaseConnectionOptions(redisUrl: string): RedisOptions {
    const url = parseRedisUrl(redisUrl)

    return {
        host: url.hostname,
        port: parsePort(url),
        username: decodeURIComponent(url.username || ''),
        password: url.password ? decodeURIComponent(url.password) : undefined,
        db: parseDatabase(url.pathname),
        connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
        enableReadyCheck: true,
    }
}

function parseRedisUrl(redisUrl: string): URL {
    const url = new URL(redisUrl)

    if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
        throw new Error('REDIS_URL must use the redis or rediss protocol')
    }

    return url
}

function parsePort(url: URL): number {
    return url.port ? Number(url.port) : REDIS_DEFAULT_PORT
}

function parseDatabase(pathname: string): number {
    const value = pathname.replace(/^\//, '')

    if (!value) {
        return 0
    }

    const parsed = Number(value)

    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error('REDIS_URL must contain a non-negative database number')
    }

    return parsed
}
