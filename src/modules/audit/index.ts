import type { RequestHandler } from 'express'
import { getDatabaseClient } from '../../shared/infrastructure/database/sequelize.client'
import { PostgresOrganizationUserRepository } from '../auth/infrastructure/repositories/postgres-organization-user.repository'
import { PostgresRoleRepository } from '../auth/infrastructure/repositories/postgres-role.repository'
import { PostgresSessionRepository } from '../auth/infrastructure/repositories/postgres-session.repository'
import { PostgresUserRepository } from '../auth/infrastructure/repositories/postgres-user.repository'
import { JwtTokenService } from '../auth/infrastructure/security/jwt-token.service'
import { createAuthenticateAccessTokenMiddleware } from '../auth/presentation/http/middlewares/authenticate-access-token.middleware'
import { createAuthorizePermissionMiddleware } from '../auth/presentation/http/middlewares/authorize-permission.middleware'
import { AuditService } from './application/services/audit.service'
import { PostgresAuditRepository } from './infrastructure/repositories/postgres-audit.repository'
import { createAuditHttpRouterFactory } from './main/factories'
import { createAuditRouter } from './presentation/http/routes'

export type AuditModule = {
    auditRouter: ReturnType<typeof createAuditRouter>
    auditService: AuditService
}

export function createAuditModule(params: {
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): AuditModule {
    const databaseClient = getDatabaseClient()
    const auditService = new AuditService(
        new PostgresAuditRepository(databaseClient),
    )
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
        auditService,
        auditRouter: createAuditHttpRouterFactory({
            auditService,
            middlewares: {
                authenticateAccessTokenMiddleware,
                authorizePermissionMiddleware,
                authorizeFeatureMiddleware: params.authorizeFeatureMiddleware,
            },
        }),
    }
}
