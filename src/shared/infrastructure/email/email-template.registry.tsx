import type { ReactElement } from 'react'
import OrganizationInvitationEmail, {
    type OrganizationInvitationEmailProps,
} from './templates/organization-invitation'
import PasswordResetEmail, {
    type PasswordResetEmailProps,
} from './templates/password-reset'
import UserCreatedEmail, {
    type UserCreatedEmailProps,
} from './templates/user-created'

export const EMAIL_TEMPLATES = {
    userCreated: 'auth.user-created',
    passwordReset: 'auth.password-reset',
    organizationInvitation: 'auth.organization-invitation',
} as const

export type EmailTemplate =
    (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES]

export type EmailTemplatePayloadMap = {
    [EMAIL_TEMPLATES.userCreated]: UserCreatedEmailProps
    [EMAIL_TEMPLATES.passwordReset]: Omit<
        PasswordResetEmailProps,
        'expiresAt'
    > & {
        expiresAt: string
    }
    [EMAIL_TEMPLATES.organizationInvitation]: Omit<
        OrganizationInvitationEmailProps,
        'expiresAt'
    > & {
        expiresAt: string
    }
}

export function renderEmailTemplate(input: {
    template: string
    payload: Record<string, unknown>
}): ReactElement {
    if (input.template === EMAIL_TEMPLATES.userCreated) {
        return <UserCreatedEmail {...toUserCreatedPayload(input.payload)} />
    }

    if (input.template === EMAIL_TEMPLATES.passwordReset) {
        return <PasswordResetEmail {...toPasswordResetPayload(input.payload)} />
    }

    if (input.template === EMAIL_TEMPLATES.organizationInvitation) {
        return (
            <OrganizationInvitationEmail
                {...toOrganizationInvitationPayload(input.payload)}
            />
        )
    }

    throw new Error(`Unsupported email template: ${input.template}`)
}

function toUserCreatedPayload(
    payload: Record<string, unknown>,
): UserCreatedEmailProps {
    return {
        name: String(payload.name),
    }
}

function toPasswordResetPayload(
    payload: Record<string, unknown>,
): PasswordResetEmailProps {
    return {
        name: String(payload.name),
        resetUrl: String(payload.resetUrl),
        expiresAt: new Date(String(payload.expiresAt)),
    }
}

function toOrganizationInvitationPayload(
    payload: Record<string, unknown>,
): OrganizationInvitationEmailProps {
    return {
        organizationName: String(payload.organizationName),
        invitationUrl: String(payload.invitationUrl),
        expiresAt: new Date(String(payload.expiresAt)),
    }
}
