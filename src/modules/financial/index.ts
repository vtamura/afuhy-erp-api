import type { RequestHandler } from 'express'
import { getDatabaseClient } from '../../shared/infrastructure/database/sequelize.client'
import { PostgresOrganizationUserRepository } from '../auth/infrastructure/repositories/postgres-organization-user.repository'
import { PostgresRoleRepository } from '../auth/infrastructure/repositories/postgres-role.repository'
import { PostgresSessionRepository } from '../auth/infrastructure/repositories/postgres-session.repository'
import { PostgresUserRepository } from '../auth/infrastructure/repositories/postgres-user.repository'
import { JwtTokenService } from '../auth/infrastructure/security/jwt-token.service'
import { createAuthenticateAccessTokenMiddleware } from '../auth/presentation/http/middlewares/authenticate-access-token.middleware'
import { createAuthorizePermissionMiddleware } from '../auth/presentation/http/middlewares/authorize-permission.middleware'
import { PostgresFinancialRepository } from './infrastructure/repositories/postgres-financial.repository'
import { SystemFinancialClock } from './infrastructure/clock/system-financial-clock'
import { createFinancialHttpRouterFactory } from './main/factories'
import { createFinancialRouter } from './presentation/http/routes'

type CreateFinancialModuleParams = {
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}

export type FinancialModule = {
    financialRouter: ReturnType<typeof createFinancialRouter>
}

export function createFinancialModule(
    params: CreateFinancialModuleParams,
): FinancialModule {
    const databaseClient = getDatabaseClient()
    const financialRepository = new PostgresFinancialRepository(databaseClient)
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
        financialRouter: createFinancialHttpRouterFactory({
            financialRepository,
            financialDashboardRepository: financialRepository,
            financialObligationRepository: financialRepository,
            financialClock: new SystemFinancialClock(),
            middlewares: {
                authenticateAccessTokenMiddleware,
                authorizePermissionMiddleware,
                authorizeFeatureMiddleware: params.authorizeFeatureMiddleware,
            },
        }),
    }
}
