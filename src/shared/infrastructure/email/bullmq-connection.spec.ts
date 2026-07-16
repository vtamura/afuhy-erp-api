import {
    createBullMqProducerConnectionOptions,
    createBullMqWorkerConnectionOptions,
    getRedisConnectionMetadata,
} from './bullmq-connection'

describe('BullMQ Redis connection', () => {
    const redisUrl = 'redis://queue-user:p%40ss%3Aword@redis.internal:6380/12'

    it('parses authentication, port and database from REDIS_URL', () => {
        expect(createBullMqProducerConnectionOptions(redisUrl)).toEqual(
            expect.objectContaining({
                host: 'redis.internal',
                port: 6380,
                username: 'queue-user',
                password: 'p@ss:word',
                db: 12,
            }),
        )
    })

    it('limits retries for the API producer', () => {
        expect(createBullMqProducerConnectionOptions(redisUrl)).toEqual(
            expect.objectContaining({
                connectTimeout: 10_000,
                enableReadyCheck: true,
                maxRetriesPerRequest: 2,
            }),
        )
    })

    it('keeps retrying for the worker', () => {
        const options = createBullMqWorkerConnectionOptions(redisUrl)

        expect(options).toEqual(
            expect.objectContaining({
                connectTimeout: 10_000,
                enableReadyCheck: true,
                maxRetriesPerRequest: null,
                retryStrategy: expect.any(Function),
            }),
        )
        expect(options.retryStrategy?.(100)).toBe(2_000)
    })

    it('returns log metadata without credentials', () => {
        const metadata = getRedisConnectionMetadata(redisUrl)

        expect(metadata).toEqual({
            host: 'redis.internal',
            port: 6380,
            db: 12,
        })
        expect(JSON.stringify(metadata)).not.toContain('queue-user')
        expect(JSON.stringify(metadata)).not.toContain('p@ss:word')
    })

    it('defaults to Redis port 6379 and database zero', () => {
        expect(getRedisConnectionMetadata('rediss://redis.internal')).toEqual({
            host: 'redis.internal',
            port: 6379,
            db: 0,
        })
    })

    it('rejects unsupported protocols', () => {
        expect(() =>
            createBullMqProducerConnectionOptions(
                'http://redis.internal:6379/0',
            ),
        ).toThrow('REDIS_URL must use the redis or rediss protocol')
    })

    it('rejects invalid database numbers', () => {
        expect(() =>
            createBullMqProducerConnectionOptions(
                'redis://redis.internal/not-a-database',
            ),
        ).toThrow('REDIS_URL must contain a non-negative database number')
    })
})
