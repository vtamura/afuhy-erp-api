import { UnauthorizedError } from '../../../../shared/domain/errors'
import type { SessionRepository } from '../../domain/repositories/session.repository'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { AuthResponseDto } from '../dto'
import { toOrganizationResponseDto } from '../mappers/organization-response.mapper'
import { toSessionResponseDto } from '../mappers/session-response.mapper'
import { toUserResponseDto } from '../mappers/user-response.mapper'
import type { PasswordHasherPort } from '../ports/password-hasher.port'
import type { RefreshTokenHasherPort } from '../ports/refresh-token-hasher.port'
import type { TokenService } from '../ports/token.service'

type LoginUseCaseInput = {
    email: string
    password: string
    userAgent?: string
    ipAddress?: string
}

type AuthUseCaseResult = AuthResponseDto & {
    tokens: {
        accessToken: string
        refreshToken: string
    }
}

export class LoginUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly organizationRepository: OrganizationRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly passwordHasher: PasswordHasherPort,
        private readonly refreshTokenHasher: RefreshTokenHasherPort,
        private readonly tokenService: TokenService,
    ) {}

    async execute(input: LoginUseCaseInput): Promise<AuthUseCaseResult> {
        const user = await this.userRepository.findByEmail(input.email)

        if (!user || !user.isActive) {
            throw new UnauthorizedError('Credenciais invalidas')
        }

        const isPasswordValid = await this.passwordHasher.compare(
            input.password,
            user.passwordHash,
        )

        if (!isPasswordValid) {
            throw new UnauthorizedError('Credenciais invalidas')
        }

        const temporaryRefreshToken = this.tokenService.signRefreshToken({
            sub: user.id,
            sessionId: '00000000-0000-0000-0000-000000000000',
            organizationId: null,
        })

        const session = await this.sessionRepository.create({
            userId: user.id,
            organizationId: null,
            refreshTokenHash: this.refreshTokenHasher.hash(
                temporaryRefreshToken,
            ),
            userAgent: input.userAgent,
            ipAddress: input.ipAddress,
            expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
        })

        const accessToken = this.tokenService.signAccessToken({
            sub: user.id,
            sessionId: session.id,
            organizationId: null,
        })
        const refreshToken = this.tokenService.signRefreshToken({
            sub: user.id,
            sessionId: session.id,
            organizationId: null,
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
