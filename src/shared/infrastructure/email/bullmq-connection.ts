import type { RedisOptions } from 'bullmq'
import { env } from '../../config/env'

export function createBullMqConnectionOptions(): RedisOptions {
    const url = new URL(env.REDIS_URL)

    return {
        host: url.hostname,
        port: url.port ? Number(url.port) : 6379,
        username: decodeURIComponent(url.username || ''),
        password: url.password ? decodeURIComponent(url.password) : undefined,
        db: parseDatabase(url.pathname),
        maxRetriesPerRequest: null,
    }
}

function parseDatabase(pathname: string): number {
    const value = pathname.replace('/', '')

    if (!value) {
        return 0
    }

    const parsed = Number(value)

    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
}
