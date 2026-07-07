const addMock = jest.fn()
const closeMock = jest.fn()

jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: addMock,
        close: closeMock,
    })),
}))

import { Queue } from 'bullmq'
import { BullMqEmailQueue } from './bullmq-email.queue'

describe('BullMqEmailQueue', () => {
    beforeEach(() => {
        addMock.mockReset().mockResolvedValue(undefined)
        closeMock.mockReset().mockResolvedValue(undefined)
        jest.mocked(Queue).mockClear()
    })

    it('configures queue defaults for retries and backoff', () => {
        new BullMqEmailQueue()

        expect(Queue).toHaveBeenCalledWith(
            'emails',
            expect.objectContaining({
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
