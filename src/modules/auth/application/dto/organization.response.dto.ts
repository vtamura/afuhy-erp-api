export type OrganizationResponseDto = {
    id: string
    name: string
    document: string
    documentType: string
    status: string
    createdAt: string
    updatedAt: string
}

export type OrganizationMemberResponseDto = {
    organizationUserId: string
    userId: string
    name: string
    email: string
    status: string
    roles: Array<{
        id: string
        code: string
        name: string
        isSystem: boolean
    }>
    createdAt: string
}

export type OrganizationRoleResponseDto = {
    id: string
    code: string
    name: string
    isSystem: boolean
    createdAt: string
}

export type OrganizationInvitationResponseDto = {
    id: string
    organizationId: string
    email: string
    status: string
    expiresAt: string
    acceptedAt: string | null
    cancelledAt: string | null
    createdAt: string
    updatedAt: string
    roles: Array<{
        id: string
        code: string
        name: string
        isSystem: boolean
    }>
    invitationToken?: string
}
