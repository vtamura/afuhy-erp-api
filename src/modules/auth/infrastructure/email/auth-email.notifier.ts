import type { EmailQueuePort } from '../../../../shared/application/ports/email-queue.port'
import { env } from '../../../../shared/config/env'
import { EMAIL_TEMPLATES } from '../../../../shared/infrastructure/email/email-template.registry'
import { buildEmailTokenUrl } from '../../../../shared/infrastructure/email/email-url'
import type {
    AuthEmailNotifierPort,
    NotifyOrganizationInvitationInput,
    NotifyPasswordResetInput,
    NotifyUserCreatedInput,
} from '../../application/ports/auth-email-notifier.port'

export class AuthEmailNotifier implements AuthEmailNotifierPort {
    constructor(private readonly emailQueue: EmailQueuePort) {}

    async notifyUserCreated(input: NotifyUserCreatedInput): Promise<void> {
        await this.emailQueue.enqueue({
            template: EMAIL_TEMPLATES.userCreated,
            to: input.email,
            subject: 'Sua conta Afuhy foi criada',
            payload: {
                name: input.name,
            },
            idempotencyKey: `auth.user-created:${input.email}`,
        })
    }

    async notifyPasswordReset(input: NotifyPasswordResetInput): Promise<void> {
        const resetUrl = buildEmailTokenUrl(
            env.PASSWORD_RESET_PATH,
            input.resetToken,
        )

        await this.emailQueue.enqueue({
            template: EMAIL_TEMPLATES.passwordReset,
            to: input.email,
            subject: 'Redefina sua senha no Afuhy',
            payload: {
                name: input.name,
                resetUrl,
                expiresAt: input.expiresAt.toISOString(),
            },
            idempotencyKey: `auth.password-reset:${input.email}:${input.resetToken}`,
        })
    }

    async notifyOrganizationInvitation(
        input: NotifyOrganizationInvitationInput,
    ): Promise<void> {
        const invitationUrl = buildEmailTokenUrl(
            env.INVITATION_ACCEPT_PATH,
            input.invitationToken,
        )

        await this.emailQueue.enqueue({
            template: EMAIL_TEMPLATES.organizationInvitation,
            to: input.email,
            subject: `Convite para ${input.organizationName}`,
            payload: {
                organizationName: input.organizationName,
                invitationUrl,
                expiresAt: input.expiresAt.toISOString(),
            },
            idempotencyKey: `auth.organization-invitation:${input.email}:${input.invitationToken}`,
        })
    }
}
