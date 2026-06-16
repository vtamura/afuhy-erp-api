import type { SessionRepository } from '../../domain/repositories/session.repository'

type RevokeOtherSessionsUseCaseInput = {
    userId: string
    currentSessionId: string
}

export class RevokeOtherSessionsUseCase {
    constructor(private readonly sessionRepository: SessionRepository) {}

    async execute(input: RevokeOtherSessionsUseCaseInput): Promise<void> {
        await this.sessionRepository.revokeOtherActiveByUser(input)
    }
}
