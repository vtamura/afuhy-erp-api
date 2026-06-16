import { UnauthorizedError } from '../../../../shared/domain/errors'
import type { SessionRepository } from '../../domain/repositories/session.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { PasswordHasherPort } from '../ports/password-hasher.port'

type ChangePasswordUseCaseInput = {
    userId: string
    currentSessionId: string
    currentPassword: string
    newPassword: string
}

export class ChangePasswordUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly passwordHasher: PasswordHasherPort,
    ) {}

    async execute(input: ChangePasswordUseCaseInput): Promise<void> {
        const user = await this.userRepository.findById(input.userId)

        if (!user || !user.isActive) {
            throw new UnauthorizedError('Usuario invalido')
        }

        const isCurrentPasswordValid = await this.passwordHasher.compare(
            input.currentPassword,
            user.passwordHash,
        )

        if (!isCurrentPasswordValid) {
            throw new UnauthorizedError('Senha atual invalida')
        }

        const passwordHash = await this.passwordHasher.hash(input.newPassword)

        await this.userRepository.updatePasswordHash({
            userId: user.id,
            passwordHash,
        })
        await this.sessionRepository.revokeOtherActiveByUser({
            userId: user.id,
            currentSessionId: input.currentSessionId,
        })
    }
}
