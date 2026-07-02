import type { RequestHandler } from 'express'
import { getDatabaseClient } from '../../shared/infrastructure/database/sequelize.client'
import { PostgresOrganizationUserRepository } from '../auth/infrastructure/repositories/postgres-organization-user.repository'
import { PostgresRoleRepository } from '../auth/infrastructure/repositories/postgres-role.repository'
import { PostgresSessionRepository } from '../auth/infrastructure/repositories/postgres-session.repository'
import { PostgresUserRepository } from '../auth/infrastructure/repositories/postgres-user.repository'
import { JwtTokenService } from '../auth/infrastructure/security/jwt-token.service'
import { createAuthenticateAccessTokenMiddleware } from '../auth/presentation/http/middlewares/authenticate-access-token.middleware'
import { createAuthorizePermissionMiddleware } from '../auth/presentation/http/middlewares/authorize-permission.middleware'
import { PostgresPayrollProvisionFinancialPort } from './infrastructure/repositories/postgres-payroll-provision-financial.port'
import { PostgresHrRepository } from './infrastructure/repositories/postgres-hr.repository'
import { createHrHttpRouterFactory } from './main/factories'
import { createHrRouter } from './presentation/http/routes'

export type HrModule = {
    hrRouter: ReturnType<typeof createHrRouter>
}

export function createHrModule(params: {
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): HrModule {
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
        hrRouter: createHrHttpRouterFactory({
            hrRepository: new PostgresHrRepository(databaseClient),
            payrollProvisionFinancialPort:
                new PostgresPayrollProvisionFinancialPort(databaseClient),
            middlewares: {
                authenticateAccessTokenMiddleware,
                authorizePermissionMiddleware,
                authorizeFeatureMiddleware: params.authorizeFeatureMiddleware,
            },
        }),
    }
}
