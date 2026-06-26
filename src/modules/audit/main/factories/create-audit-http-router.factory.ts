import {
    GetAuditLogUseCase,
    ListAuditLogsUseCase,
} from '../../application/use-cases'
import {
    GetAuditLogController,
    ListAuditLogsController,
} from '../../presentation/http/controllers'
import { createAuditRouter } from '../../presentation/http/routes'
import type { AuditHttpRouterFactoryDependencies } from './audit-http-router-factory.types'

export function createAuditHttpRouterFactory(
    deps: AuditHttpRouterFactoryDependencies,
) {
    return createAuditRouter({
        controllers: {
            list: new ListAuditLogsController(
                new ListAuditLogsUseCase(deps.auditService),
            ),
            get: new GetAuditLogController(
                new GetAuditLogUseCase(deps.auditService),
            ),
        },
        authenticateAccessTokenMiddleware:
            deps.middlewares.authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware:
            deps.middlewares.authorizePermissionMiddleware,
        authorizeFeatureMiddleware: deps.middlewares.authorizeFeatureMiddleware,
    })
}
