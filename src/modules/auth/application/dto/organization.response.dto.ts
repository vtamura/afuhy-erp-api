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
