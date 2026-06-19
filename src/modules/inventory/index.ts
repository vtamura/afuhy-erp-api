import type { RequestHandler } from 'express'
import { getDatabaseClient } from '../../shared/infrastructure/database/sequelize.client'
import { PostgresOrganizationUserRepository } from '../auth/infrastructure/repositories/postgres-organization-user.repository'
import { PostgresRoleRepository } from '../auth/infrastructure/repositories/postgres-role.repository'
import { PostgresSessionRepository } from '../auth/infrastructure/repositories/postgres-session.repository'
import { PostgresUserRepository } from '../auth/infrastructure/repositories/postgres-user.repository'
import { JwtTokenService } from '../auth/infrastructure/security/jwt-token.service'
import { createAuthenticateAccessTokenMiddleware } from '../auth/presentation/http/middlewares/authenticate-access-token.middleware'
import { createAuthorizePermissionMiddleware } from '../auth/presentation/http/middlewares/authorize-permission.middleware'
import { PostgresInventoryRepository } from './infrastructure/repositories/postgres-inventory.repository'
import { createInventoryHttpRouterFactory } from './main/factories'
import { createInventoryRouter } from './presentation/http/routes'

export type InventoryModule = {
    inventoryRouter: ReturnType<typeof createInventoryRouter>
}

export function createInventoryModule(params: {
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): InventoryModule {
    const databaseClient = getDatabaseClient()
    const authenticateAccessTokenMiddleware =
        createAuthenticateAccessTokenMiddleware(
            new PostgresUserRepository(databaseClient),
            new PostgresSessionRepository(databaseClient),
            new JwtTokenService(),
        )
    const authorizePermissionMiddleware = createAuthorizePermissionMiddleware(
        new PostgresOrganizationUserRepository(databaseClient),
        new PostgresRoleRepository(databaseClient),
    )
    return {
        inventoryRouter: createInventoryHttpRouterFactory({
            inventoryRepository: new PostgresInventoryRepository(
                databaseClient,
            ),
            middlewares: {
                authenticateAccessTokenMiddleware,
                authorizePermissionMiddleware,
                authorizeFeatureMiddleware: params.authorizeFeatureMiddleware,
            },
        }),
    }
}
