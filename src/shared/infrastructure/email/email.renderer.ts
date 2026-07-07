import { render } from '@react-email/render'
import { renderEmailTemplate } from './email-template.registry'
import type { EmailJobData, RenderedEmail } from './email-job'

export async function renderEmail(job: EmailJobData): Promise<RenderedEmail> {
    const element = renderEmailTemplate({
        template: job.template,
        payload: job.payload,
    })

    return {
        to: job.to,
        subject: job.subject,
        html: await render(element),
        text: await render(element, { plainText: true }),
    }
}
