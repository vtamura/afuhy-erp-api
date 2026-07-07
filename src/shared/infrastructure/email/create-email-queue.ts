import type { EmailQueuePort } from '../../application/ports/email-queue.port'
import { env } from '../../config/env'
import { createLogger } from '../logger/logger'
import { BullMqEmailQueue } from './bullmq-email.queue'
import { LogEmailQueue } from './log-email.queue'

export function createEmailQueue(): EmailQueuePort {
    const logger = createLogger({ component: 'email.queue' })

    if (env.EMAIL_QUEUE_DRIVER === 'bullmq') {
        return new BullMqEmailQueue(logger)
    }

    return new LogEmailQueue(logger)
}
