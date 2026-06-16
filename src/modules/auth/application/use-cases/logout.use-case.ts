import type { SessionRepository } from '../../domain/repositories/session.repository'
import type { TokenService } from '../ports/token.service'

type LogoutUseCaseInput = {
    refreshToken?: string
}

export class LogoutUseCase {
    constructor(
        private readonly sessionRepository: SessionRepository,
        private readonly tokenService: TokenService,
    ) {}

    async execute(input: LogoutUseCaseInput): Promise<void> {
        if (!input.refreshToken) {
            return
        }

        try {
            const payload = this.tokenService.verifyRefreshToken(
                input.refreshToken,
            )
            await this.sessionRepository.revoke(payload.sessionId)
        } catch {
            return
        }
    }
}
