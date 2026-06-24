import type { RequestHandler } from 'express'
import type { LoanRepository } from '../../domain/repositories/loan.repository'

export type LoansHttpRouterFactoryDependencies = {
    loanRepository: LoanRepository
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
    }
}
