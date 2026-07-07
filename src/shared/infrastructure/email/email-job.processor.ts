import type { Job } from 'bullmq'
import { createLogger, serializeError, type Logger } from '../logger/logger'
import type { EmailJobData, RenderedEmail } from './email-job'
import { renderEmail } from './email.renderer'
import { ResendEmailSender } from './resend-email.sender'

type EmailSender = {
    send(input: RenderedEmail): Promise<void>
}

export function createEmailJobProcessor(
    sender: EmailSender = new ResendEmailSender(),
    logger: Logger = createLogger({ component: 'email.worker' }),
) {
    return async (job: Job<EmailJobData, void, string>): Promise<void> => {
        try {
            const email = await renderEmail(job.data)

            await sender.send(email)
            logger.info('email.worker.sent', {
                jobId: job.id,
                template: job.data.template,
                to: email.to,
            })
        } catch (error) {
            logger.error('email.worker.failed', {
                jobId: job.id,
                template: job.data.template,
                error: serializeError(error),
            })
            throw error
        }
    }
}
