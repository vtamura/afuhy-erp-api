import type { SessionEntity } from '../entities/session.entity'

export type CreateSessionInput = {
    userId: string
    organizationId?: string | null
    refreshTokenHash: string
    userAgent?: string
    ipAddress?: string
    expiresAt: Date
}

export type RotateRefreshTokenInput = {
    sessionId: string
    refreshTokenHash: string
    expiresAt: Date
}

export type SelectOrganizationInput = {
    sessionId: string
    organizationId: string | null
    refreshTokenHash: string
    expiresAt: Date
}

export interface SessionRepository {
    create(input: CreateSessionInput): Promise<SessionEntity>
    findById(id: string): Promise<SessionEntity | null>
    listActiveByUserId(userId: string): Promise<SessionEntity[]>
    rotateRefreshToken(input: RotateRefreshTokenInput): Promise<void>
    selectOrganization(input: SelectOrganizationInput): Promise<void>
    revoke(sessionId: string): Promise<void>
    revokeByUser(input: { userId: string; sessionId: string }): Promise<boolean>
    revokeOtherActiveByUser(input: {
        userId: string
        currentSessionId: string
    }): Promise<void>
    revokeAllActiveByUser(userId: string): Promise<void>
}
