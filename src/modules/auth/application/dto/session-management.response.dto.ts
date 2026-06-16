export type ManagedSessionResponseDto = {
    id: string
    organizationId: string | null
    userAgent: string | null
    ipAddress: string | null
    status: string
    expiresAt: string
    createdAt: string
}
