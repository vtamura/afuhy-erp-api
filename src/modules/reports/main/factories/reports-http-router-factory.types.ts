import type { RequestHandler } from 'express'
import type { ReportsRepository } from '../../domain/repositories/report.repository'

export type ReportsHttpRouterFactoryDependencies = {
    reportsRepository: ReportsRepository
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
    }
}
