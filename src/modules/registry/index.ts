import type { RequestHandler } from 'express'
import { getDatabaseClient } from '../../shared/infrastructure/database/sequelize.client'
import { PostgresOrganizationUserRepository } from '../auth/infrastructure/repositories/postgres-organization-user.repository'
import { PostgresRoleRepository } from '../auth/infrastructure/repositories/postgres-role.repository'
import { PostgresSessionRepository } from '../auth/infrastructure/repositories/postgres-session.repository'
import { PostgresUserRepository } from '../auth/infrastructure/repositories/postgres-user.repository'
import { JwtTokenService } from '../auth/infrastructure/security/jwt-token.service'
import { createAuthenticateAccessTokenMiddleware } from '../auth/presentation/http/middlewares/authenticate-access-token.middleware'
import { createAuthorizePermissionMiddleware } from '../auth/presentation/http/middlewares/authorize-permission.middleware'
import { PostgresRegistryRecordRepository } from './infrastructure/repositories/postgres-registry-record.repository'
import { createRegistryHttpRouterFactory } from './main/factories'
import { createRegistryRouter } from './presentation/http/routes'

type CreateRegistryModuleParams = {
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}

export type RegistryModule = {
    registryRouter: ReturnType<typeof createRegistryRouter>
}

export function createRegistryModule(
    params: CreateRegistryModuleParams,
): RegistryModule {
    const databaseClient = getDatabaseClient()
    const registryRecordRepository = new PostgresRegistryRecordRepository(
        databaseClient,
    )
    const userRepository = new PostgresUserRepository(databaseClient)
    const sessionRepository = new PostgresSessionRepository(databaseClient)
    const organizationUserRepository = new PostgresOrganizationUserRepository(
        databaseClient,
    )
    const roleRepository = new PostgresRoleRepository(databaseClient)
    const tokenService = new JwtTokenService()

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
        registryRouter: createRegistryHttpRouterFactory({
            registryRecordRepository,
            middlewares: {
                authenticateAccessTokenMiddleware,
                authorizePermissionMiddleware,
                authorizeFeatureMiddleware: params.authorizeFeatureMiddleware,
            },
        }),
    }
}
