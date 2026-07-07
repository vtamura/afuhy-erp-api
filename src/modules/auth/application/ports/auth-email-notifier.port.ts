export type NotifyUserCreatedInput = {
    name: string
    email: string
}

export type NotifyPasswordResetInput = {
    name: string
    email: string
    resetToken: string
    expiresAt: Date
}

export type NotifyOrganizationInvitationInput = {
    email: string
    organizationName: string
    invitationToken: string
    expiresAt: Date
}

export type AuthEmailNotifierPort = {
    notifyUserCreated(input: NotifyUserCreatedInput): Promise<void>
    notifyPasswordReset(input: NotifyPasswordResetInput): Promise<void>
    notifyOrganizationInvitation(
        input: NotifyOrganizationInvitationInput,
    ): Promise<void>
}
