import type {
    EmailJobInput,
    EmailQueuePort,
} from '../../application/ports/email-queue.port'
import { createLogger, type Logger } from '../logger/logger'

export class LogEmailQueue implements EmailQueuePort {
    constructor(
        private readonly logger: Logger = createLogger({
            component: 'email.queue',
        }),
    ) {}

    async enqueue(input: EmailJobInput): Promise<void> {
        this.logger.info('email.queue.enqueued', {
            template: input.template,
            to: input.to,
            subject: input.subject,
            payload: input.payload,
            idempotencyKey: input.idempotencyKey,
        })
    }
}
