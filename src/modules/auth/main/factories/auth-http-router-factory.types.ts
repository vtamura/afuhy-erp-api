import type { RequestHandler } from 'express'
import type { PasswordHasherPort } from '../../application/ports/password-hasher.port'
import type { RefreshTokenHasherPort } from '../../application/ports/refresh-token-hasher.port'
import type { TokenService } from '../../application/ports/token.service'
import type { OrganizationInvitationRepository } from '../../domain/repositories/organization-invitation.repository'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import type { SessionRepository } from '../../domain/repositories/session.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'

export type TokenGenerator = {
    generate(): string
}

export type AuthHttpRouterFactoryDependencies = {
    repositories: {
        userRepository: UserRepository
        organizationRepository: OrganizationRepository
        organizationUserRepository: OrganizationUserRepository
        organizationInvitationRepository: OrganizationInvitationRepository
        roleRepository: RoleRepository
        sessionRepository: SessionRepository
        passwordResetTokenRepository: PasswordResetTokenRepository
    }
    security: {
        passwordHasher: PasswordHasherPort
        refreshTokenHasher: RefreshTokenHasherPort
        secureTokenGenerator: TokenGenerator
        tokenService: TokenService
    }
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
            options?: { organizationIdParam?: string },
        ) => RequestHandler
        enforceUserLimitMiddleware?: (options?: {
            organizationIdParam?: string
        }) => RequestHandler
    }
}
