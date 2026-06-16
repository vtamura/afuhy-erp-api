import { UnauthorizedError } from '../../../../shared/domain/errors'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { SessionRepository } from '../../domain/repositories/session.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { AuthResponseDto } from '../dto'
import { toOrganizationResponseDto } from '../mappers/organization-response.mapper'
import { toSessionResponseDto } from '../mappers/session-response.mapper'
import { toUserResponseDto } from '../mappers/user-response.mapper'
import type { RefreshTokenHasherPort } from '../ports/refresh-token-hasher.port'
import type { TokenService } from '../ports/token.service'

type RefreshSessionUseCaseInput = {
    refreshToken?: string
}

type AuthUseCaseResult = AuthResponseDto & {
    tokens: {
        accessToken: string
        refreshToken: string
    }
}

export class RefreshSessionUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly organizationRepository: OrganizationRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly refreshTokenHasher: RefreshTokenHasherPort,
        private readonly tokenService: TokenService,
    ) {}

    async execute(
        input: RefreshSessionUseCaseInput,
    ): Promise<AuthUseCaseResult> {
        if (!input.refreshToken) {
            throw new UnauthorizedError('Refresh token ausente')
        }

        const payload = this.tokenService.verifyRefreshToken(input.refreshToken)
        const session = await this.sessionRepository.findById(payload.sessionId)

        if (
            !session ||
            !session.isActive ||
            session.refreshTokenHash !==
                this.refreshTokenHasher.hash(input.refreshToken)
        ) {
            throw new UnauthorizedError('Sessao invalida')
        }

        const user = await this.userRepository.findById(session.userId)

        if (!user || !user.isActive) {
            throw new UnauthorizedError('Usuario invalido')
        }

        const accessToken = this.tokenService.signAccessToken({
            sub: user.id,
            sessionId: session.id,
            organizationId: session.organizationId,
        })
        const refreshToken = this.tokenService.signRefreshToken({
            sub: user.id,
            sessionId: session.id,
            organizationId: session.organizationId,
        })

        await this.sessionRepository.rotateRefreshToken({
            sessionId: session.id,
            refreshTokenHash: this.refreshTokenHasher.hash(refreshToken),
            expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
        })

        const organizations = await this.organizationRepository.listByUserId(
            user.id,
        )

        return {
            user: toUserResponseDto(user),
            session: toSessionResponseDto(session),
            organizations: organizations.map(toOrganizationResponseDto),
            tokens: {
                accessToken,
                refreshToken,
            },
        }
    }
}
