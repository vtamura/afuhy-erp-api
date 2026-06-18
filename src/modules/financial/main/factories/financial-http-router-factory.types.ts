import type { RequestHandler } from 'express'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialDashboardRepository } from '../../domain/repositories/financial-dashboard.repository'
import type { FinancialObligationRepository } from '../../domain/repositories/financial-obligation.repository'
import type { FinancialClock } from '../../application/ports/financial-clock.port'

export type FinancialHttpRouterFactoryDependencies = {
    financialRepository: FinancialRepository
    financialDashboardRepository: FinancialDashboardRepository
    financialObligationRepository: FinancialObligationRepository
    financialClock: FinancialClock
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
    }
}
