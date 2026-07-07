import { env } from '../../../../shared/config/env'
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { AuthEmailNotifierPort } from '../ports/auth-email-notifier.port'
import type { RefreshTokenHasherPort } from '../ports/refresh-token-hasher.port'

type ForgotPasswordUseCaseInput = {
    email: string
}

type ForgotPasswordUseCaseResult = {
    resetToken?: string
}

type TokenGenerator = {
    generate(): string
}

const RESET_TOKEN_EXPIRES_IN_MS = 30 * 60 * 1000

export class ForgotPasswordUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
        private readonly tokenHasher: RefreshTokenHasherPort,
        private readonly tokenGenerator: TokenGenerator,
        private readonly emailNotifier?: AuthEmailNotifierPort,
    ) {}

    async execute(
        input: ForgotPasswordUseCaseInput,
    ): Promise<ForgotPasswordUseCaseResult> {
        const user = await this.userRepository.findByEmail(input.email)

        if (!user || !user.isActive) {
            return {}
        }

        const resetToken = this.tokenGenerator.generate()
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_IN_MS)

        await this.passwordResetTokenRepository.create({
            userId: user.id,
            tokenHash: this.tokenHasher.hash(resetToken),
            expiresAt,
        })

        await this.enqueuePasswordResetEmail({
            name: user.name,
            email: user.email,
            resetToken,
            expiresAt,
        })

        if (env.NODE_ENV !== 'development') {
            return {}
        }

        return { resetToken }
    }

    private async enqueuePasswordResetEmail(input: {
        name: string
        email: string
        resetToken: string
        expiresAt: Date
    }): Promise<void> {
        try {
            await this.emailNotifier?.notifyPasswordReset(input)
        } catch {
            // Email delivery must not reveal account existence or block reset.
        }
    }
}
