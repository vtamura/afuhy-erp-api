import { UnauthorizedError } from '../../../../shared/domain/errors'
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository'
import type { SessionRepository } from '../../domain/repositories/session.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { PasswordHasherPort } from '../ports/password-hasher.port'
import type { RefreshTokenHasherPort } from '../ports/refresh-token-hasher.port'

type ResetPasswordUseCaseInput = {
    token: string
    newPassword: string
}

export class ResetPasswordUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
        private readonly passwordHasher: PasswordHasherPort,
        private readonly tokenHasher: RefreshTokenHasherPort,
    ) {}

    async execute(input: ResetPasswordUseCaseInput): Promise<void> {
        const tokenHash = this.tokenHasher.hash(input.token)
        const passwordResetToken =
            await this.passwordResetTokenRepository.findByTokenHash(tokenHash)

        if (!passwordResetToken?.isUsable) {
            throw new UnauthorizedError('Token de reset invalido')
        }

        const user = await this.userRepository.findById(
            passwordResetToken.userId,
        )

        if (!user || !user.isActive) {
            throw new UnauthorizedError('Token de reset invalido')
        }

        const passwordHash = await this.passwordHasher.hash(input.newPassword)

        await this.userRepository.updatePasswordHash({
            userId: user.id,
            passwordHash,
        })
        await this.passwordResetTokenRepository.markAsUsed(
            passwordResetToken.id,
        )
        await this.sessionRepository.revokeAllActiveByUser(user.id)
    }
}
