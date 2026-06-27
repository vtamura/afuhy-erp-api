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
import type { AuthContextService } from '../services/auth-context.service'

type SelectOrganizationUseCaseInput = {
    organizationId: string
    refreshToken?: string
}

type AuthUseCaseResult = AuthResponseDto & {
    tokens: {
        accessToken: string
        refreshToken: string
    }
}

export class SelectOrganizationUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly organizationRepository: OrganizationRepository,
        private readonly refreshTokenHasher: RefreshTokenHasherPort,
        private readonly tokenService: TokenService,
        private readonly authContextService: AuthContextService,
    ) {}

    async execute(
        input: SelectOrganizationUseCaseInput,
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

        const context = await this.authContextService.resolve({
            userId: user.id,
            organizationId: input.organizationId,
        })

        const accessToken = this.tokenService.signAccessToken({
            sub: user.id,
            sessionId: session.id,
            organizationId: input.organizationId,
        })
        const refreshToken = this.tokenService.signRefreshToken({
            sub: user.id,
            sessionId: session.id,
            organizationId: input.organizationId,
        })

        await this.sessionRepository.selectOrganization({
            sessionId: session.id,
            organizationId: input.organizationId,
            refreshTokenHash: this.refreshTokenHasher.hash(refreshToken),
            expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
        })

        const organizations = await this.organizationRepository.listByUserId(
            user.id,
        )

        return {
            user: toUserResponseDto(user),
            session: {
                ...toSessionResponseDto(session),
                organizationId: input.organizationId,
            },
            organizations: organizations.map(toOrganizationResponseDto),
            ...context,
            tokens: {
                accessToken,
                refreshToken,
            },
        }
    }
}
