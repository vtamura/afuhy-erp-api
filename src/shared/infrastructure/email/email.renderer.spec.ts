const renderMock = jest.fn()

jest.mock('@react-email/render', () => ({
    render: renderMock,
}))

import type React from 'react'
import { renderEmail } from './email.renderer'
import { EMAIL_TEMPLATES, renderEmailTemplate } from './email-template.registry'
import { buildEmailTokenUrl } from './email-url'

describe('email renderer', () => {
    beforeEach(() => {
        renderMock
            .mockReset()
            .mockImplementation(
                async (
                    _element: React.ReactElement,
                    options?: { plainText?: boolean },
                ) =>
                    options?.plainText
                        ? 'plain text content'
                        : '<html>Email</html>',
            )
    })

    it('builds token URLs with URL encoded tokens', () => {
        expect(buildEmailTokenUrl('/reset-password', 'raw token/+')).toBe(
            'http://localhost:3000/reset-password?token=raw+token%2F%2B',
        )
    })

    it('renders email jobs with html and text output', async () => {
        const email = await renderEmail({
            template: EMAIL_TEMPLATES.passwordReset,
            to: 'maria@afuhy.local',
            subject: 'Redefina sua senha no Afuhy',
            payload: {
                name: 'Maria Silva',
                resetUrl:
                    'http://localhost:3000/reset-password?token=raw-token',
                expiresAt: '2026-01-01T00:30:00.000Z',
            },
        })

        expect(email).toEqual({
            to: 'maria@afuhy.local',
            subject: 'Redefina sua senha no Afuhy',
            html: '<html>Email</html>',
            text: 'plain text content',
        })
        expect(renderMock).toHaveBeenCalledTimes(2)
        expect(renderMock.mock.calls[0][0].props).toMatchObject({
            name: 'Maria Silva',
            resetUrl: 'http://localhost:3000/reset-password?token=raw-token',
            expiresAt: new Date('2026-01-01T00:30:00.000Z'),
        })
        expect(renderMock.mock.calls[1][1]).toEqual({ plainText: true })
    })

    it('throws for unsupported templates', () => {
        expect(() =>
            renderEmailTemplate({
                template: 'unknown.template',
                payload: {},
            }),
        ).toThrow('Unsupported email template')
    })
})
