import type { RequestHandler } from 'express'
import { getDatabaseClient } from '../../shared/infrastructure/database/sequelize.client'
import { PostgresOrganizationRepository } from './infrastructure/repositories/postgres-organization.repository'
import { PostgresOrganizationInvitationRepository } from './infrastructure/repositories/postgres-organization-invitation.repository'
import { PostgresOrganizationUserRepository } from './infrastructure/repositories/postgres-organization-user.repository'
import { PostgresPasswordResetTokenRepository } from './infrastructure/repositories/postgres-password-reset-token.repository'
import { PostgresRoleRepository } from './infrastructure/repositories/postgres-role.repository'
import { PostgresSessionRepository } from './infrastructure/repositories/postgres-session.repository'
import { PostgresUserRepository } from './infrastructure/repositories/postgres-user.repository'
import { createEmailQueue } from '../../shared/infrastructure/email/create-email-queue'
import { AuthEmailNotifier } from './infrastructure/email/auth-email.notifier'
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher'
import { JwtTokenService } from './infrastructure/security/jwt-token.service'
import { SecureTokenGenerator } from './infrastructure/security/secure-token-generator'
import { Sha256RefreshTokenHasher } from './infrastructure/security/sha256-refresh-token-hasher'
import {
    type AuthHttpRouterFactoryDependencies,
    createAuthHttpRouterFactory,
    createOrganizationsHttpRouterFactory,
    createUsersHttpRouterFactory,
} from './main/factories'
import { createAuthenticateAccessTokenMiddleware } from './presentation/http/middlewares/authenticate-access-token.middleware'
import { createAuthorizePermissionMiddleware } from './presentation/http/middlewares/authorize-permission.middleware'
import {
    createAuthRouter,
    createOrganizationsRouter,
    createUsersRouter,
} from './presentation/http/routes'

export type AuthModule = {
    authRouter: ReturnType<typeof createAuthRouter>
    organizationsRouter: ReturnType<typeof createOrganizationsRouter>
    usersRouter: ReturnType<typeof createUsersRouter>
}

type CreateAuthModuleParams = {
    enforceUserLimitMiddleware?: (options?: {
        organizationIdParam?: string
    }) => RequestHandler
}

export function createAuthModule(
    params: CreateAuthModuleParams = {},
): AuthModule {
    const factoryDependencies = createAuthHttpRouterFactoryDependencies(params)

    return {
        authRouter: createAuthHttpRouterFactory(factoryDependencies),
        organizationsRouter:
            createOrganizationsHttpRouterFactory(factoryDependencies),
        usersRouter: createUsersHttpRouterFactory(factoryDependencies),
    }
}

function createAuthHttpRouterFactoryDependencies(
    params: CreateAuthModuleParams,
): AuthHttpRouterFactoryDependencies {
    const databaseClient = getDatabaseClient()
    const userRepository = new PostgresUserRepository(databaseClient)
    const organizationRepository = new PostgresOrganizationRepository(
        databaseClient,
    )
    const organizationUserRepository = new PostgresOrganizationUserRepository(
        databaseClient,
    )
    const organizationInvitationRepository =
        new PostgresOrganizationInvitationRepository(databaseClient)
    const roleRepository = new PostgresRoleRepository(databaseClient)
    const sessionRepository = new PostgresSessionRepository(databaseClient)
    const passwordResetTokenRepository =
        new PostgresPasswordResetTokenRepository(databaseClient)
    const passwordHasher = new BcryptPasswordHasher()
    const refreshTokenHasher = new Sha256RefreshTokenHasher()
    const secureTokenGenerator = new SecureTokenGenerator()
    const tokenService = new JwtTokenService()
    const emailNotifier = new AuthEmailNotifier(createEmailQueue())
    const authenticateAccessTokenMiddleware =
        createAuthenticateAccessTokenMiddleware(
            userRepository,
            sessionRepository,
            tokenService,
        )
    const authorizePermissionMiddleware = createAuthorizePermissionMiddleware(
        organizationUserRepository,
        roleRepository,
    )

    return {
        repositories: {
            userRepository,
            organizationRepository,
            organizationUserRepository,
            organizationInvitationRepository,
            roleRepository,
            sessionRepository,
            passwordResetTokenRepository,
        },
        security: {
            passwordHasher,
            refreshTokenHasher,
            secureTokenGenerator,
            tokenService,
        },
        queues: {
            emailNotifier,
        },
        middlewares: {
            authenticateAccessTokenMiddleware,
            authorizePermissionMiddleware,
            enforceUserLimitMiddleware: params.enforceUserLimitMiddleware,
        },
    }
}
