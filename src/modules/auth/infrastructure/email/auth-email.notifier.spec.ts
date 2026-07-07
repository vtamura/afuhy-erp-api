import type { EmailQueuePort } from '../../../../shared/application/ports/email-queue.port'
import { EMAIL_TEMPLATES } from '../../../../shared/infrastructure/email/email-template.registry'
import { AuthEmailNotifier } from './auth-email.notifier'

describe('AuthEmailNotifier', () => {
    function makeSut() {
        const emailQueue: EmailQueuePort = {
            enqueue: jest.fn(),
        }
        const notifier = new AuthEmailNotifier(emailQueue)

        return { emailQueue, notifier }
    }

    it('enqueues a user created email using the shared template contract', async () => {
        const { emailQueue, notifier } = makeSut()

        await notifier.notifyUserCreated({
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
        })

        expect(emailQueue.enqueue).toHaveBeenCalledWith({
            template: EMAIL_TEMPLATES.userCreated,
            to: 'maria@afuhy.local',
            subject: 'Sua conta Afuhy foi criada',
            payload: {
                name: 'Maria Silva',
            },
            idempotencyKey: 'auth.user-created:maria@afuhy.local',
        })
    })

    it('enqueues password reset with a public reset URL', async () => {
        const { emailQueue, notifier } = makeSut()

        await notifier.notifyPasswordReset({
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
            resetToken: 'raw-token',
            expiresAt: new Date('2026-01-01T00:30:00.000Z'),
        })

        expect(emailQueue.enqueue).toHaveBeenCalledWith({
            template: EMAIL_TEMPLATES.passwordReset,
            to: 'maria@afuhy.local',
            subject: 'Redefina sua senha no Afuhy',
            payload: {
                name: 'Maria Silva',
                resetUrl:
                    'http://localhost:3000/reset-password?token=raw-token',
                expiresAt: '2026-01-01T00:30:00.000Z',
            },
            idempotencyKey: 'auth.password-reset:maria@afuhy.local:raw-token',
        })
    })

    it('enqueues organization invitation with a public invitation URL', async () => {
        const { emailQueue, notifier } = makeSut()

        await notifier.notifyOrganizationInvitation({
            email: 'maria@afuhy.local',
            organizationName: 'Afuhy Tecnologia',
            invitationToken: 'invite-token',
            expiresAt: new Date('2026-01-08T00:00:00.000Z'),
        })

        expect(emailQueue.enqueue).toHaveBeenCalledWith({
            template: EMAIL_TEMPLATES.organizationInvitation,
            to: 'maria@afuhy.local',
            subject: 'Convite para Afuhy Tecnologia',
            payload: {
                organizationName: 'Afuhy Tecnologia',
                invitationUrl:
                    'http://localhost:3000/invitations/accept?token=invite-token',
                expiresAt: '2026-01-08T00:00:00.000Z',
            },
            idempotencyKey:
                'auth.organization-invitation:maria@afuhy.local:invite-token',
        })
    })
})
