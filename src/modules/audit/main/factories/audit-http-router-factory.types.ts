import type { RequestHandler } from 'express'
import type { AuditService } from '../../application/services/audit.service'

export type AuditHttpRouterFactoryDependencies = {
    auditService: AuditService
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
    }
}
