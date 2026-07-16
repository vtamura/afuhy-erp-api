const addMock = jest.fn()
const closeMock = jest.fn()
const onMock = jest.fn()

jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: addMock,
        close: closeMock,
        on: onMock,
    })),
}))

import { Queue } from 'bullmq'
import { env } from '../../config/env'
import { getRedisConnectionMetadata } from './bullmq-connection'
import { BullMqEmailQueue } from './bullmq-email.queue'

describe('BullMqEmailQueue', () => {
    beforeEach(() => {
        addMock.mockReset().mockResolvedValue(undefined)
        closeMock.mockReset().mockResolvedValue(undefined)
        onMock.mockReset()
        jest.mocked(Queue).mockClear()
    })

    it('configures queue defaults for retries and backoff', () => {
        new BullMqEmailQueue()

        expect(Queue).toHaveBeenCalledWith(
            'emails',
            expect.objectContaining({
                prefix: env.BULLMQ_PREFIX,
                defaultJobOptions: {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 30000,
                    },
                    removeOnComplete: true,
                    removeOnFail: 1000,
                },
            }),
        )
        expect(onMock).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('logs Redis errors without exposing the connection URL', () => {
        const logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            child: jest.fn(),
        }
        new BullMqEmailQueue(logger)
        const errorHandler = onMock.mock.calls.find(
            ([event]) => event === 'error',
        )?.[1] as ((error: Error) => void) | undefined

        errorHandler?.(new Error('redis unavailable'))

        expect(logger.error).toHaveBeenCalledWith(
            'email.queue.redis_error',
            expect.objectContaining({
                queueName: env.EMAIL_QUEUE_NAME,
                ...getRedisConnectionMetadata(),
            }),
        )
        const logContext = logger.error.mock.calls[0]?.[1]
        expect(logContext).not.toHaveProperty('redisUrl')
        expect(JSON.stringify(logContext)).not.toContain(env.REDIS_URL)
    })

    it('enqueues generic email jobs with idempotency keys', async () => {
        const queue = new BullMqEmailQueue()

        await queue.enqueue({
            template: 'auth.password-reset',
            to: 'maria@afuhy.local',
            subject: 'Redefina sua senha no Afuhy',
            payload: {
                resetUrl:
                    'http://localhost:3000/reset-password?token=raw-token',
            },
            idempotencyKey: 'auth.password-reset:maria@afuhy.local:raw-token',
        })

        expect(addMock).toHaveBeenCalledWith(
            'auth.password-reset',
            {
                template: 'auth.password-reset',
                to: 'maria@afuhy.local',
                subject: 'Redefina sua senha no Afuhy',
                payload: {
                    resetUrl:
                        'http://localhost:3000/reset-password?token=raw-token',
                },
                idempotencyKey:
                    'auth.password-reset:maria@afuhy.local:raw-token',
            },
            {
                jobId: 'auth.password-reset:maria@afuhy.local:raw-token',
            },
        )
    })

    it('does not throw when BullMQ enqueue fails', async () => {
        const queue = new BullMqEmailQueue()
        addMock.mockRejectedValue(new Error('redis unavailable'))

        await expect(
            queue.enqueue({
                template: 'auth.user-created',
                to: 'maria@afuhy.local',
                subject: 'Sua conta Afuhy foi criada',
                payload: {
                    name: 'Maria Silva',
                },
            }),
        ).resolves.toBeUndefined()
    })
})
