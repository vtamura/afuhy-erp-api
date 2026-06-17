import { getDatabaseClient } from '../../shared/infrastructure/database/sequelize.client'
import { PostgresOrganizationUserRepository } from '../auth/infrastructure/repositories/postgres-organization-user.repository'
import { PostgresRoleRepository } from '../auth/infrastructure/repositories/postgres-role.repository'
import { PostgresSessionRepository } from '../auth/infrastructure/repositories/postgres-session.repository'
import { PostgresUserRepository } from '../auth/infrastructure/repositories/postgres-user.repository'
import { JwtTokenService } from '../auth/infrastructure/security/jwt-token.service'
import { createAuthenticateAccessTokenMiddleware } from '../auth/presentation/http/middlewares/authenticate-access-token.middleware'
import { createAuthorizePermissionMiddleware } from '../auth/presentation/http/middlewares/authorize-permission.middleware'
import { PostgresBillingRepository } from './infrastructure/repositories/postgres-billing.repository'
import { createBillingHttpRouterFactory } from './main/factories'
import { createAuthorizeFeatureMiddleware } from './presentation/http/middlewares/authorize-feature.middleware'
import { createEnforceUserLimitMiddleware } from './presentation/http/middlewares/enforce-user-limit.middleware'
import { createBillingRouter } from './presentation/http/routes'

export type BillingModule = {
    billingRouter: ReturnType<typeof createBillingRouter>
    authorizeFeatureMiddleware: ReturnType<
        typeof createAuthorizeFeatureMiddleware
    >
    enforceUserLimitMiddleware: ReturnType<
        typeof createEnforceUserLimitMiddleware
    >
}

export function createBillingModule(): BillingModule {
    const databaseClient = getDatabaseClient()
    const billingRepository = new PostgresBillingRepository(databaseClient)
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
    const authorizeFeatureMiddleware =
        createAuthorizeFeatureMiddleware(billingRepository)
    const enforceUserLimitMiddleware =
        createEnforceUserLimitMiddleware(billingRepository)

    return {
        billingRouter: createBillingHttpRouterFactory({
            billingRepository,
            middlewares: {
                authenticateAccessTokenMiddleware,
                authorizePermissionMiddleware,
            },
        }),
        authorizeFeatureMiddleware,
        enforceUserLimitMiddleware,
    }
}
