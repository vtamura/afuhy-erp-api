import type { RequestHandler } from 'express'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'

export type FinancialHttpRouterFactoryDependencies = {
    financialRepository: FinancialRepository
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
    }
}
