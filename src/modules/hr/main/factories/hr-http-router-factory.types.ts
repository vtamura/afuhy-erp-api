import type { RequestHandler } from 'express'
import type { HrRepository } from '../../domain/repositories/hr.repository'

export type HrHttpRouterFactoryDependencies = {
    hrRepository: HrRepository
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
    }
}
