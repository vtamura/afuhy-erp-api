const renderEmailMock = jest.fn()

jest.mock('./email.renderer', () => ({
    renderEmail: renderEmailMock,
}))

import type { Job } from 'bullmq'
import { createEmailJobProcessor } from './email-job.processor'
import type { EmailJobData } from './email-job'

describe('email job processor', () => {
    beforeEach(() => {
        renderEmailMock.mockReset().mockResolvedValue({
            to: 'maria@afuhy.local',
            subject: 'Sua conta Afuhy foi criada',
            html: '<html>Email</html>',
            text: 'Email',
        })
    })

    function makeJob(data: EmailJobData): Job<EmailJobData, void, string> {
        return {
            id: 'job-1',
            name: data.template,
            data,
            attemptsMade: 0,
        } as Job<EmailJobData, void, string>
    }

    it('renders and sends a generic email job', async () => {
        const sender = {
            send: jest.fn().mockResolvedValue(undefined),
        }
        const processor = createEmailJobProcessor(sender)
        const jobData = {
            template: 'auth.user-created',
            to: 'maria@afuhy.local',
            subject: 'Sua conta Afuhy foi criada',
            payload: {
                name: 'Maria Silva',
            },
        }

        await processor(makeJob(jobData))

        expect(renderEmailMock).toHaveBeenCalledWith(jobData)
        expect(sender.send).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'maria@afuhy.local',
                subject: 'Sua conta Afuhy foi criada',
            }),
        )
    })

    it('rethrows renderer failures so BullMQ can retry/fail them', async () => {
        const sender = {
            send: jest.fn().mockResolvedValue(undefined),
        }
        const processor = createEmailJobProcessor(sender)
        renderEmailMock.mockRejectedValue(
            new Error('Unsupported email template'),
        )

        await expect(
            processor(
                makeJob({
                    template: 'unknown.template',
                    to: 'maria@afuhy.local',
                    subject: 'Email',
                    payload: {},
                }),
            ),
        ).rejects.toThrow('Unsupported email template')
        expect(sender.send).not.toHaveBeenCalled()
    })
})
