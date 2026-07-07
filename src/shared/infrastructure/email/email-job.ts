import type { EmailJobInput } from '../../application/ports/email-queue.port'

export type EmailJobData = EmailJobInput

export type RenderedEmail = {
    to: string
    subject: string
    html: string
    text: string
}
