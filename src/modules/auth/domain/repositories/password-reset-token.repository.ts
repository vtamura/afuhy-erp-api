import type { PasswordResetTokenEntity } from '../entities/password-reset-token.entity'

export type CreatePasswordResetTokenInput = {
    userId: string
    tokenHash: string
    expiresAt: Date
}

export interface PasswordResetTokenRepository {
    create(
        input: CreatePasswordResetTokenInput,
    ): Promise<PasswordResetTokenEntity>
    findByTokenHash(tokenHash: string): Promise<PasswordResetTokenEntity | null>
    markAsUsed(tokenId: string): Promise<void>
}
