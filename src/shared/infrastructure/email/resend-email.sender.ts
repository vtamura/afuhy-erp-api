import { Resend } from 'resend'
import { env } from '../../config/env'
import type { RenderedEmail } from './email-job'

export class ResendEmailSender {
    private readonly resend: Resend

    constructor(resend: Resend = new Resend(env.RESEND_API_KEY)) {
        this.resend = resend
    }

    async send(input: RenderedEmail): Promise<void> {
        const result = await this.resend.emails.send({
            from: formatFromAddress(),
            to: input.to,
            subject: input.subject,
            html: input.html,
            text: input.text,
        })

        if (result.error) {
            throw new Error(result.error.message)
        }
    }
}

function formatFromAddress(): string {
    return `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`
}
