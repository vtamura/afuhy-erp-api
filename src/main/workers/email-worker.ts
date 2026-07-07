import { Worker } from 'bullmq'
import { env } from '../../shared/config/env'
import {
    createLogger,
    serializeError,
} from '../../shared/infrastructure/logger/logger'
import { createEmailJobProcessor } from '../../shared/infrastructure/email/email-job.processor'
import { createBullMqConnectionOptions } from '../../shared/infrastructure/email/bullmq-connection'
import type { EmailJobData } from '../../shared/infrastructure/email/email-job'

const logger = createLogger({ component: 'email.worker' })

const worker = new Worker<EmailJobData, void, string>(
    env.EMAIL_QUEUE_NAME,
    createEmailJobProcessor(undefined, logger),
    {
        connection: createBullMqConnectionOptions(),
        concurrency: env.EMAIL_WORKER_CONCURRENCY,
    },
)

worker.on('ready', () => {
    logger.info('email.worker.ready', {
        queueName: env.EMAIL_QUEUE_NAME,
        concurrency: env.EMAIL_WORKER_CONCURRENCY,
    })
})

worker.on('failed', (job, error) => {
    logger.error('email.worker.job_failed', {
        jobId: job?.id,
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
        error: serializeError(error),
    })
})

async function shutdown(signal: string): Promise<void> {
    logger.info('email.worker.shutdown', { signal })
    await worker.close()
}

process.on('SIGINT', () => {
    void shutdown('SIGINT').then(() => process.exit(0))
})

process.on('SIGTERM', () => {
    void shutdown('SIGTERM').then(() => process.exit(0))
})
