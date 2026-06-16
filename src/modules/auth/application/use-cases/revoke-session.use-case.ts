import { NotFoundError } from '../../../../shared/domain/errors'
import type { SessionRepository } from '../../domain/repositories/session.repository'

type RevokeSessionUseCaseInput = {
    userId: string
    sessionId: string
}

export class RevokeSessionUseCase {
    constructor(private readonly sessionRepository: SessionRepository) {}

    async execute(input: RevokeSessionUseCaseInput): Promise<void> {
        const revoked = await this.sessionRepository.revokeByUser(input)

        if (!revoked) {
            throw new NotFoundError('Sessao nao encontrada')
        }
    }
}
