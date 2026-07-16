import { Queue, type JobsOptions } from 'bullmq'
import type {
    EmailJobInput,
    EmailQueuePort,
} from '../../application/ports/email-queue.port'
import { env } from '../../config/env'
import { createLogger, serializeError, type Logger } from '../logger/logger'
import {
    createBullMqProducerConnectionOptions,
    getRedisConnectionMetadata,
} from './bullmq-connection'
import type { EmailJobData } from './email-job'

export class BullMqEmailQueue implements EmailQueuePort {
    private readonly queue: Queue<EmailJobData, void, string>
    private readonly logger: Logger

    constructor(logger: Logger = createLogger({ component: 'email.queue' })) {
        this.logger = logger
        this.queue = new Queue<EmailJobData, void, string>(
            env.EMAIL_QUEUE_NAME,
            {
                connection: createBullMqProducerConnectionOptions(),
                prefix: env.BULLMQ_PREFIX,
                defaultJobOptions: this.getDefaultJobOptions(),
            },
        )
        this.queue.on('error', (error) => {
            this.logger.error('email.queue.redis_error', {
                queueName: env.EMAIL_QUEUE_NAME,
                ...getRedisConnectionMetadata(),
                error: serializeError(error),
            })
        })
    }

    async enqueue(input: EmailJobInput): Promise<void> {
        try {
            await this.queue.add(input.template, input, {
                jobId: input.idempotencyKey,
            })
        } catch (error) {
            this.logger.error('email.queue.enqueue_failed', {
                template: input.template,
                to: input.to,
                error: serializeError(error),
            })
        }
    }

    async close(): Promise<void> {
        await this.queue.close()
    }

    private getDefaultJobOptions(): JobsOptions {
        return {
            attempts: env.EMAIL_JOB_ATTEMPTS,
            backoff: {
                type: 'exponential',
                delay: env.EMAIL_JOB_BACKOFF_MS,
            },
            removeOnComplete: true,
            removeOnFail: 1000,
        }
    }
}
