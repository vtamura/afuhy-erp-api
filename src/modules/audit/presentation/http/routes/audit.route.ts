import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../../auth/domain/rbac/default-rbac'
import type {
    GetAuditLogController,
    ListAuditLogsController,
} from '../controllers'

export function createAuditRouter(params: {
    controllers: {
        list: ListAuditLogsController
        get: GetAuditLogController
    }
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (permissionCode: string) => RequestHandler
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): Router {
    const router = Router()
    const auth = params.authenticateAccessTokenMiddleware
    const read = params.authorizePermissionMiddleware(
        AUTH_PERMISSIONS.AUDIT_LOGS_READ,
    )
    const feature = params.authorizeFeatureMiddleware('audit.logs')

    router.get(
        '/audit/logs',
        auth,
        read,
        feature,
        params.controllers.list.handle,
    )
    router.get(
        '/audit/logs/:id',
        auth,
        read,
        feature,
        params.controllers.get.handle,
    )

    return router
}
